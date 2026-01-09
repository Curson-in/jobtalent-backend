import { sendEmail } from "../services/email/email.service.js";

sendEmail({
  to: "YOUR_PERSONAL_EMAIL@gmail.com",
  subject: "Brevo Test",
  html: "<h1>Brevo working ✅</h1>",
});
