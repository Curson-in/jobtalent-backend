import { brevo } from "./brevo.client.js";

export const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    console.error("Email not sent: missing fields", {
      to,
      subject,
      htmlExists: !!html,
    });
    return;
  }

  try {
    await brevo.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      to: [{ email: to }],
      subject,
      htmlContent: String(html), // 🔥 force string
    });

    console.log("Brevo email sent to:", to);
  } catch (err) {
    console.error(
      "Brevo email failed:",
      err.response?.body || err.message
    );
  }
};
