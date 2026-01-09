import { brevo } from './brevo.client.js';

export const sendPasswordOtp = async ({ email, otp }) => {
  await brevo.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: 'Curson'
    },
    to: [{ email }],
    subject: 'Your password reset code',
    htmlContent: `
      <p>Your password reset code is:</p>
      <h2>${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `
  });
};
