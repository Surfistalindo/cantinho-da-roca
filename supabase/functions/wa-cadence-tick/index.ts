// Cron tick: processa leads em 'contacting' e envia próxima etapa da cadência
// Régua: 3 mensagens (configuráveis via whatsapp_templates step_order 1,2,3)
// Após o último passo, marca cadence_exhausted = true.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Carrega config Z-API
    const { data: config } = await admin
      .from("whatsapp_config")
      .select("instance_id")
      .eq("provider", "zapi")
      .maybeSingle();

    const instanceId = config?.instance_id;
    const instanceToken = Deno.env.get("ZAPI_INSTANCE_TOKEN");
    const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!instanceId || !instanceToken || !clientToken) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Z-API não configurado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Carrega templates ativos da cadência (ordenados)
    const { data: templates } = await admin
      .from("whatsapp_templates")
      .select("step_order, body_preview, meta_name, delay_hours")
      .eq("is_active", true)
      .not("step_order", "is", null)
      .order("step_order", { ascending: true });

    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Sem templates" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const totalSteps = templates.length;
    const nowIso = new Date().toISOString();

    // Busca leads elegíveis
    // - status = contacting
    // - whatsapp_opt_out = false
    // - cadence_exhausted = false
    // - phone presente
    // - cadence_next_at <= now() OU (cadence_state = idle e ainda não iniciou)
    const { data: leads, error: leadsErr } = await admin
      .from("leads")
      .select("id, name, phone, cadence_step, cadence_state, cadence_next_at, cadence_started_at")
      .eq("status", "contacting")
      .eq("whatsapp_opt_out", false)
      .eq("cadence_exhausted", false)
      .not("phone", "is", null)
      .or(`cadence_next_at.lte.${nowIso},cadence_state.eq.idle`)
      .limit(50);

    if (leadsErr) throw leadsErr;
    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const baseUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}`;
    let sent = 0, failed = 0, exhausted = 0;

    for (const lead of leads) {
      const nextStep = (lead.cadence_step ?? 0) + 1;
      const tpl = templates.find((t) => t.step_order === nextStep);

      if (!tpl) {
        // Sem template para o próximo passo → esgotada
        await admin.from("leads").update({
          cadence_exhausted: true,
          cadence_state: "exhausted",
        }).eq("id", lead.id);
        exhausted++;
        continue;
      }

      const phone = normalizePhone(lead.phone || "");
      if (!phone) continue;

      const message = renderTemplate(tpl.body_preview, {
        nome: lead.name?.split(" ")[0] ?? "",
        nome_completo: lead.name ?? "",
      });

      const zRes = await fetch(`${baseUrl}/send-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Client-Token": clientToken },
        body: JSON.stringify({ phone, message }),
      });
      const zJson = await zRes.json().catch(() => ({}));
      const ok = zRes.ok && !zJson?.error;

      await admin.from("whatsapp_messages").insert({
        direction: "outbound",
        status: ok ? "sent" : "failed",
        message_type: "text",
        body: message,
        template_name: tpl.meta_name,
        cadence_step: nextStep,
        lead_id: lead.id,
        wa_message_id: zJson?.messageId ?? zJson?.id ?? null,
        error_code: ok ? null : String(zRes.status),
        error_message: ok ? null : JSON.stringify(zJson).slice(0, 500),
      });

      if (ok) sent++; else failed++;

      // Calcula próximo agendamento (delay do PRÓXIMO template, se existir)
      const nextTpl = templates.find((t) => t.step_order === nextStep + 1);
      const isLast = !nextTpl;
      const nextAt = nextTpl
        ? new Date(Date.now() + (nextTpl.delay_hours ?? 48) * 3600_000).toISOString()
        : null;

      await admin.from("leads").update({
        cadence_step: nextStep,
        cadence_state: isLast ? "exhausted" : "active",
        cadence_started_at: lead.cadence_started_at ?? new Date().toISOString(),
        cadence_last_sent_at: new Date().toISOString(),
        cadence_next_at: nextAt,
        cadence_exhausted: isLast,
      }).eq("id", lead.id);

      if (isLast) exhausted++;
    }

    return new Response(
      JSON.stringify({ processed: leads.length, sent, failed, exhausted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[wa-cadence-tick]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
