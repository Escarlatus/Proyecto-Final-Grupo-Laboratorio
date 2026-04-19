import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Secretos (configúralos en Supabase Dashboard > Edge Functions > Secrets) ───
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Personaliza estos valores ────────────────────────────────────────────────
const FROM_EMAIL = "Laboratorio SRSPM <notificaciones@tudominio.com>"; // ← cambia al dominio verificado en Resend
const APP_URL = "https://tu-app.vercel.app"; // ← cambia a la URL de producción

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Mapa de estados y sus significados ──────────────────────────────────────
const STATUS_CONFIG: Record<
  number,
  { label: string; color: string; icon: string; mensaje: string }
> = {
  1: {
    label: "Pendiente",
    color: "#6B7280",
    icon: "🕐",
    mensaje: "Tu solicitud está en cola y será procesada próximamente.",
  },
  2: {
    label: "En Revisión Documental",
    color: "#F59E0B",
    icon: "🔍",
    mensaje:
      "Un revisor técnico está evaluando la documentación de tu solicitud.",
  },
  3: {
    label: "Evaluación Técnica Favorable",
    color: "#10B981",
    icon: "✅",
    mensaje:
      "La evaluación técnica ha sido favorable. Tu solicitud avanza al siguiente proceso.",
  },
  4: {
    label: "Rechazada",
    color: "#EF4444",
    icon: "❌",
    mensaje:
      "Tu solicitud ha sido rechazada. Revisa las observaciones adjuntas para más detalles.",
  },
  5: {
    label: "Aprobada - Certificación Emitida",
    color: "#059669",
    icon: "🏆",
    mensaje:
      "¡Enhorabuena! Tu solicitud ha sido aprobada y la certificación ha sido emitida.",
  },
  6: {
    label: "Observada",
    color: "#8B5CF6",
    icon: "📋",
    mensaje:
      "Tu solicitud requiere correcciones. Por favor revisa las observaciones y actualiza la documentación.",
  },
};

// ─── Plantilla HTML del email ─────────────────────────────────────────────────
function buildEmailHtml(data: {
  applicantName: string;
  requestNumber: string;
  statusId: number;
  reviewerObservations: string | null;
  appUrl: string;
}): string {
  const status = STATUS_CONFIG[data.statusId] ?? {
    label: `Estado ${data.statusId}`,
    color: "#6B7280",
    icon: "ℹ️",
    mensaje: "El estado de tu solicitud ha sido actualizado.",
  };

  const observationsBlock = data.reviewerObservations
    ? `
    <div style="margin:24px 0;padding:16px 20px;background:#F9FAFB;border-left:4px solid ${status.color};border-radius:0 8px 8px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.05em;">
        Observaciones del revisor
      </p>
      <p style="margin:0;font-size:15px;color:#4B5563;line-height:1.6;">${data.reviewerObservations}</p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Actualización de Solicitud</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">Sistema de Gestión de Laboratorios</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.2;">Actualización de Solicitud</h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="margin:0 0 20px;font-size:16px;color:#374151;">
                Hola, <strong>${data.applicantName}</strong>
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
                Te informamos que el estado de tu solicitud ha sido actualizado.
              </p>

              <!-- Número de solicitud -->
              <div style="margin-bottom:20px;padding:14px 20px;background:#EFF6FF;border-radius:8px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#3B82F6;text-transform:uppercase;letter-spacing:.08em;font-weight:600;">Número de Solicitud</p>
                <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1E3A8A;letter-spacing:.05em;">${data.requestNumber}</p>
              </div>

              <!-- Badge de estado -->
              <div style="margin:24px 0;padding:20px;background:#F9FAFB;border-radius:10px;text-align:center;border:2px solid ${status.color}22;">
                <p style="margin:0 0 6px;font-size:28px;">${status.icon}</p>
                <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;">Nuevo estado</p>
                <span style="display:inline-block;padding:6px 18px;background:${status.color};color:#fff;border-radius:20px;font-size:15px;font-weight:600;">
                  ${status.label}
                </span>
                <p style="margin:14px 0 0;font-size:14px;color:#6B7280;line-height:1.5;">${status.mensaje}</p>
              </div>

              ${observationsBlock}

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0 8px;">
                <a href="${data.appUrl}/app/mis-solicitudes"
                   style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1E3A8A,#1D4ED8);color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:.02em;">
                  Ver mi solicitud →
                </a>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                Este es un mensaje automático del Sistema de Gestión de Laboratorios.<br/>
                Por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parsear payload del Webhook de Supabase
    const payload = await req.json();
    const { record, old_record, type } = payload;

    // Solo procesar UPDATEs con cambio de estado
    if (type !== "UPDATE" || record.status_id === old_record?.status_id) {
      return new Response(
        JSON.stringify({ message: "No status change – skipping." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Crear cliente Supabase con Service Role (acceso total, seguro server-side)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Obtener datos del solicitante (email y nombre desde identity_users + identity_persons)
    const { data: userData, error: userError } = await supabase
      .from("identity_users")
      .select(
        `
        person_id,
        identity_persons (
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("user_id", record.applicant_user_id)
      .single();

    if (userError || !userData?.identity_persons) {
      throw new Error(
        `No se pudo obtener el email del solicitante: ${userError?.message ?? "sin datos"}`
      );
    }

    const person = userData.identity_persons as {
      first_name: string;
      last_name: string;
      email: string;
    };

    const applicantName = `${person.first_name} ${person.last_name}`;
    const applicantEmail = person.email;

    // 4. Construir y enviar el email con Resend
    const emailPayload = {
      from: FROM_EMAIL,
      to: [applicantEmail],
      subject: `${STATUS_CONFIG[record.status_id]?.icon ?? "📬"} Actualización de ${record.request_number}`,
      html: buildEmailHtml({
        applicantName,
        requestNumber: record.request_number,
        statusId: record.status_id,
        reviewerObservations: record.reviewer_observations ?? null,
        appUrl: APP_URL,
      }),
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    console.log(
      `✅ Email enviado a ${applicantEmail} para solicitud ${record.request_number} → estado ${record.status_id}`
    );

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error en notify-status-change:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
