/**
 * Stubbed transactional email sender. No provider was chosen at build time, so
 * this logs instead of sending. Swap the body of `sendEmail` for a real provider
 * (Resend, Postmark, SES, ...) later — every call site already goes through here.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  console.log(`[email:stub] to=${opts.to} subject="${opts.subject}"`);
  return { id: `stub-${Date.now()}`, delivered: false, stub: true };
}
