import twilio from "twilio";

export class TwilioWAProvider {
  private enabled = String(process.env.TWILIO_ENABLED ?? "false") === "true";
  private from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
  private client: ReturnType<typeof twilio> | null = null;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (this.enabled && sid && token) {
      this.client = twilio(sid, token);
    } else {
      this.enabled = false; // fallback a simulado si falta config
    }
  }

  /**
   * Envía un texto simple por WhatsApp (sandbox o producción).
   * 'toE164' debe incluir prefijo: "whatsapp:+54911..."
   */
  async sendText(toE164: string, body: string) {
    if (!this.enabled || !this.client) {
      console.log("📨 [SIMULADO][Twilio] ->", toE164, ":", body);
      return { simulated: true };
    }
    const res = await this.client.messages.create({
      from: this.from,
      to: toE164.startsWith("whatsapp:") ? toE164 : `whatsapp:${toE164}`,
      body,
    });
    return res;
  }
}
