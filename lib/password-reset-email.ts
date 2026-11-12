import nodemailer from "nodemailer";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function emailConfiguration() {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(requiredEnv("SMTP_PORT"));
  const secureValue = requiredEnv("SMTP_SECURE").toLowerCase();
  const user = requiredEnv("SMTP_USER");
  const password = requiredEnv("SMTP_APP_PASSWORD").replace(/\s+/g, "");
  const from = requiredEnv("EMAIL_FROM");
  const appUrl = new URL(requiredEnv("APP_URL"));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }
  if (secureValue !== "true" && secureValue !== "false") {
    throw new Error("SMTP_SECURE must be true or false.");
  }
  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  if (appUrl.pathname !== "/" || appUrl.search || appUrl.hash) {
    throw new Error("APP_URL must be an origin without a path, query, or fragment.");
  }

  const fromAddress = from.match(/<([^<>]+)>/)?.[1] ?? from;
  if (fromAddress.trim().toLowerCase() !== user.toLowerCase()) {
    throw new Error("EMAIL_FROM address must match SMTP_USER.");
  }

  return { host, port, secure: secureValue === "true", user, password, from, appUrl };
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  token: string;
}) {
  const config = emailConfiguration();
  const resetUrl = new URL("/reset-password", config.appUrl);
  resetUrl.hash = new URLSearchParams({ token: input.token }).toString();
  const safeName = escapeHtml(input.name);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    const result = await transporter.sendMail({
      from: config.from,
      to: input.email,
      subject: "Reset Your MarketingTribe Password",
      text: [
        `Hi ${input.name},`,
        "",
        "We received a request to reset the password for your MarketingTribe account.",
        `Reset your password: ${resetUrl.toString()}`,
        "",
        "This link expires in 30 minutes and can only be used once.",
        "If you did not request a password reset, you can ignore this email. Your password will not change.",
      ].join("\n"),
      html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Reset your MarketingTribe password</title>
  </head>
  <body style="margin:0;background:#f3f0e8;color:#1c1916;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f0e8;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4ded2;border-radius:12px;">
          <tr><td style="padding:32px 28px;">
            <p style="margin:0 0 24px;color:#1c1916;font-family:Georgia,serif;font-size:24px;font-weight:bold;">MarketingTribe</p>
            <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;line-height:1.25;font-weight:normal;">Reset your password</h1>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Hi ${safeName}, we received a request to reset the password for your MarketingTribe account.</p>
            <p style="margin:28px 0;text-align:center;">
              <a href="${resetUrl.toString()}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#1c1916;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Reset password</a>
            </p>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#625b52;">This link expires in <strong>30 minutes</strong> and can only be used once.</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#625b52;">If you did not request a password reset, you can ignore this email. Your password will not change.</p>
            <hr style="margin:28px 0;border:0;border-top:1px solid #e4ded2;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#81796f;">If the button does not work, copy and paste this link into your browser:<br><a href="${resetUrl.toString()}" style="color:#1c1916;word-break:break-all;">${resetUrl.toString()}</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    });

    if (result.accepted.length === 0 || result.rejected.length > 0) {
      throw new Error("SMTP provider did not accept the password reset email.");
    }
  } finally {
    transporter.close();
  }
}
