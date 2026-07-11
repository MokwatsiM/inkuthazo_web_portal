import { defineSecret, defineString } from "firebase-functions/params";
/**
 * Brevo transactional email via plain REST (Node 20 global fetch — no SDK).
 * Free tier: 300 emails/day, verified single sender.
 */

export const BREVO_API_KEY = defineSecret("BREVO_API_KEY");

/** Deployed portal origin, used to build email CTA links (functions/.env) */
export const APP_URL = defineString("APP_URL", {
  default: "http://localhost:5173",
});

const SENDER = {
  name: "Inkuthazo Social Club",
  email: "inkuthazoburialclub@gmail.com",
};

export async function sendBrevoEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<void> {
 const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY.value(),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: opts.to, ...(opts.toName && { name: opts.toName }) }],
      subject: opts.subject,
      htmlContent: opts.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo ${response.status}: ${await response.text()}`);
  }
}
