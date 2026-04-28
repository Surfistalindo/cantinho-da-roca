// Edge function: envia mensagens via Z-API (texto ou imagem)
// Auth obrigatória (admin/vendedor). Loga em whatsapp_messages.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendBody {
  phone: string;
  type: "text" | "image";
  message?: string;
  imageUrl?: string;
  caption?: string;
  leadId?: string;
  cadenceStep?: number;
  templateName?: string;
}

function normalizePhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;
  // Z-API exige código do país. Se vier sem 55, prefixa.
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as SendBody;

    // ---- Validação ----
    const phone = normalizePhone(body.phone);
    if (!phone || phone.length < 12) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.type !== "text" && body.type !== "image") {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.type === "text" && !body.message?.trim()) {
      return new Response(JSON.stringify({ error: "Mensagem obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.type === "image" && !body.imageUrl?.trim()) {
      return new Response(JSON.stringify({ error: "URL da imagem obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Carrega config Z-API ----
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: config } = await admin
      .from("whatsapp_config")
      .select("instance_id, is_configured")
      .eq("provider", "zapi")
      .maybeSingle();

    const instanceId = config?.instance_id;
    const instanceToken = Deno.env.get("ZAPI_INSTANCE_TOKEN");
    const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!instanceId || !instanceToken || !clientToken) {
      return new Response(
        JSON.stringify({
          error:
            "Z-API não configurado. Cadastre Instance ID e tokens em /admin/whatsapp.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ---- Chamada Z-API ----
    const baseUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}`;
    const endpoint = body.type === "text" ? "send-text" : "send-image";
    const payload =
      body.type === "text"
        ? { phone, message: body.message }
        : { phone, image: body.imageUrl, caption: body.caption ?? "" };

    const zRes = await fetch(`${baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify(payload),
    });

    const zJson = await zRes.json().catch(() => ({}));
    const ok = zRes.ok && !zJson?.error;

    // ---- Log em whatsapp_messages ----
    await admin.from("whatsapp_messages").insert({
      direction: "outbound",
      status: ok ? "sent" : "failed",
      message_type: body.type,
      body: body.type === "text" ? body.message : body.caption ?? null,
      image_url: body.type === "image" ? body.imageUrl : null,
      template_name: body.templateName ?? null,
      cadence_step: body.cadenceStep ?? null,
      lead_id: body.leadId ?? null,
      wa_message_id: zJson?.messageId ?? zJson?.id ?? null,
      error_code: ok ? null : String(zRes.status),
      error_message: ok ? null : JSON.stringify(zJson).slice(0, 500),
    });

    if (!ok) {
      return new Response(
        JSON.stringify({
          error: zJson?.error ?? `Falha Z-API (HTTP ${zRes.status})`,
          details: zJson,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: zJson?.messageId ?? zJson?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[wa-send] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
