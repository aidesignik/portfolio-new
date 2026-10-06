import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
// Resend's own shared test sender — works without a verified domain, but
// only delivers to the account owner's own inbox. Set EMAIL_FROM once a
// domain is verified in the Resend dashboard.
const fromAddress = process.env.EMAIL_FROM || "Atlas <onboarding@resend.dev>";

let client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(apiKey);
}

function getClient(): Resend {
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  if (!client) client = new Resend(apiKey);
  return client;
}

export async function sendMail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
  if (error) throw new Error(error.message);
}
