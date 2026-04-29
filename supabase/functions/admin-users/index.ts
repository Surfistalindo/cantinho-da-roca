import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type Action =
  | 'list-users'
  | 'create-user'
  | 'update-user'
  | 'update-password'
  | 'send-password-reset'
  | 'set-role'
  | 'delete-user';

interface Body {
  action: Action;
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'vendedor' | 'usuario';
  user_id?: string;
  profile?: {
    name?: string | null;
    phone?: string | null;
    bio?: string | null;
    job_title?: string | null;
    avatar_url?: string | null;
    is_active?: boolean;
  };
  redirect_to?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Cliente do chamador (com JWT)
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace('Bearer ', ''),
  );
  if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
  const callerId = claims.claims.sub as string;

  // Verifica role admin
  const { data: isAdminData, error: isAdminErr } = await userClient.rpc('has_role', {
    _user_id: callerId,
    _role: 'admin',
  });
  if (isAdminErr || !isAdminData) {
    return json({ error: 'Apenas administradores podem executar esta ação.' }, 403);
  }

  // Cliente admin (service role)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  try {
    switch (body.action) {
      case 'list-users': {
        // Lista todos auth users + profiles + roles
        const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 200 });
        if (error) throw error;

        const userIds = list.users.map((u) => u.id);
        const [profilesRes, rolesRes] = await Promise.all([
          admin.from('profiles').select('user_id,name,email,avatar_url,phone,bio,job_title,is_active,updated_at').in('user_id', userIds),
          admin.from('user_roles').select('user_id,role').in('user_id', userIds),
        ]);

        const profByUser = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
        const rolesByUser = new Map<string, string[]>();
        for (const r of rolesRes.data ?? []) {
          const arr = rolesByUser.get(r.user_id) ?? [];
          arr.push(r.role as string);
          rolesByUser.set(r.user_id, arr);
        }

        const merged = list.users.map((u) => {
          const roles = rolesByUser.get(u.id) ?? [];
          const role = roles.includes('admin') ? 'admin' : roles.includes('vendedor') ? 'vendedor' : roles.includes('usuario') ? 'usuario' : null;
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            email_confirmed_at: u.email_confirmed_at,
            profile: profByUser.get(u.id) ?? null,
            role,
          };
        });

        return json({ users: merged });
      }

      case 'create-user': {
        const { email, password, name, role } = body;
        if (!email || !password || password.length < 6) {
          return json({ error: 'Email e senha (mín. 6 caracteres) são obrigatórios.' }, 400);
        }
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: name ?? email.split('@')[0] },
        });
        if (error) throw error;
        const newId = created.user!.id;

        // Trigger handle_new_user já criou o profile. Atualiza o nome se fornecido.
        if (name) {
          await admin.from('profiles').update({ name }).eq('user_id', newId);
        }

        // Define role (default vendedor)
        const targetRole = role ?? 'vendedor';
        // Limpa roles existentes (assign_default_role pode ter inserido vendedor) e seta a desejada
        await admin.from('user_roles').delete().eq('user_id', newId);
        await admin.from('user_roles').insert({ user_id: newId, role: targetRole });

        return json({ user_id: newId });
      }

      case 'update-user': {
        if (!body.user_id) return json({ error: 'user_id obrigatório' }, 400);
        const p = body.profile ?? {};
        const update: Record<string, unknown> = {};
        for (const k of ['name', 'phone', 'bio', 'job_title', 'avatar_url', 'is_active'] as const) {
          if (p[k] !== undefined) update[k] = p[k];
        }
        if (Object.keys(update).length > 0) {
          const { error } = await admin.from('profiles').update(update).eq('user_id', body.user_id);
          if (error) throw error;
        }
        return json({ ok: true });
      }

      case 'set-role': {
        if (!body.user_id || !body.role) return json({ error: 'user_id e role obrigatórios' }, 400);
        await admin.from('user_roles').delete().eq('user_id', body.user_id);
        const { error } = await admin.from('user_roles').insert({ user_id: body.user_id, role: body.role });
        if (error) throw error;
        return json({ ok: true });
      }

      case 'update-password': {
        if (!body.user_id || !body.password || body.password.length < 6) {
          return json({ error: 'user_id e nova senha (mín. 6) obrigatórios.' }, 400);
        }
        const { error } = await admin.auth.admin.updateUserById(body.user_id, {
          password: body.password,
        });
        if (error) throw error;
        return json({ ok: true });
      }

      case 'send-password-reset': {
        if (!body.email) return json({ error: 'email obrigatório' }, 400);
        const redirectTo = body.redirect_to ?? `${new URL(req.url).origin}/reset-password`;
        const { error } = await admin.auth.resetPasswordForEmail(body.email, { redirectTo });
        if (error) throw error;
        return json({ ok: true });
      }

      case 'delete-user': {
        if (!body.user_id) return json({ error: 'user_id obrigatório' }, 400);
        if (body.user_id === callerId) {
          return json({ error: 'Você não pode excluir a si mesmo.' }, 400);
        }
        const { error } = await admin.auth.admin.deleteUser(body.user_id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: 'Ação desconhecida' }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    console.error('admin-users error:', msg);
    return json({ error: msg }, 400);
  }
});
