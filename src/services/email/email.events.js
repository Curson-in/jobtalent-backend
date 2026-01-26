import { sendEmail } from "./email.service.js";
import { welcomeEmail } from "../../templates/emails/welcome.email.js";
import { jobReminderEmail } from "../../templates/emails/jobReminder.email.js";
import { paymentSuccessEmail } from "../../templates/emails/paymentSuccess.email.js";
import { paymentFailedEmail } from "../../templates/emails/paymentFailed.email.js";

export const sendWelcome = (user) =>
  sendEmail({
    to: user.email,
    subject: "Welcome to Curson 🎉",
    html: welcomeEmail(user.name),
  });

export const sendJobReminder = (user, jobs) =>
  sendEmail({
    to: user.email,
    subject: "New jobs for you ",
    html: jobReminderEmail(user.name, jobs),
  });

export const sendPaymentSuccess = (user, plan) =>
  sendEmail({
    to: user.email,
    subject: "Payment Successful ",
    html: paymentSuccessEmail(user.name, plan),
  });

export const sendPaymentFailed = (user) =>
  sendEmail({
    to: user.email,
    subject: "Payment Failed ",
    html: paymentFailedEmail(user.name),
  });