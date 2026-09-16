import { Resend } from "resend";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

let client: Resend | null = null;
function getResend() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * Sends transactional email via Resend. Falls back to a console log when
 * RESEND_API_KEY / EMAIL_FROM aren't set, so the app keeps working without
 * email configured (order confirmations, admin notifications, etc. just won't send).
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!isEmailConfigured()) {
    console.log(`[email:stub] to=${opts.to} subject="${opts.subject}"`);
    return { id: `stub-${Date.now()}`, delivered: false, stub: true };
  }

  try {
    const result = await getResend().emails.send({
      from: process.env.EMAIL_FROM!,
      to: opts.to,
      subject: opts.subject,
      html: opts.html
    });
    if (result.error) {
      console.error("sendEmail failed", result.error);
      return { id: null, delivered: false, stub: false };
    }
    return { id: result.data?.id ?? null, delivered: true, stub: false };
  } catch (err) {
    console.error("sendEmail failed", err);
    return { id: null, delivered: false, stub: false };
  }
}
