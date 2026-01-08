import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

interface InviteEmailPayload {
  invitation_id: string;
  product_name: string;
  email: string;
  role: "editor" | "viewer";
  token: string;
  invite_url: string;
  message?: string | null;
}

Deno.serve(async (req: Request) => {
  try {
    // Validar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obter payload
    const payload: InviteEmailPayload = await req.json();
    const { invitation_id, product_name, email, role, invite_url, message } = payload;

    // Validar dados obrigatórios
    if (!invitation_id || !product_name || !email || !role || !invite_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar token do convite
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se convite existe e está pendente
    const { data: invitation, error: inviteError } = await supabase
      .from("product_invitations")
      .select("*")
      .eq("id", invitation_id)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found or already processed" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar se não expirou
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      // Marcar como expirado
      await supabase
        .from("product_invitations")
        .update({ status: "expired" })
        .eq("id", invitation_id);

      return new Response(
        JSON.stringify({ error: "Invitation expired" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Preparar texto do papel
    const roleText = role === "editor" 
      ? "Editor (pode editar o contexto e criar vereditos)"
      : "Visualizador (apenas visualização)";

    // Construir corpo do e-mail (texto simples, sem linguagem comercial)
    let emailBody = `Você foi convidado(a) para colaborar em um produto no Pachai.

Produto: ${product_name}
Papel: ${roleText}

O Pachai é um espaço de pensamento contínuo para amadurecer decisões de produto.

Ao aceitar o convite, você terá acesso ao contexto cognitivo e aos vereditos desse produto.
Conversas privadas não são compartilhadas.

Aceitar convite:
${invite_url}`;

    // Adicionar mensagem pessoal se houver
    if (message && message.trim()) {
      emailBody += `\n\nMensagem pessoal:\n${message.trim()}`;
    }

    // Enviar e-mail via Resend
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      // Em desenvolvimento, apenas logar
      console.log("Would send email:", {
        to: email,
        subject: "Convite para colaborar em um produto no Pachai",
        body: emailBody,
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email would be sent (RESEND_API_KEY not configured)" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Pachai <noreply@pachai.app>", // Ajustar conforme configuração
        to: email,
        subject: "Convite para colaborar em um produto no Pachai",
        text: emailBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: resendData.id 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
