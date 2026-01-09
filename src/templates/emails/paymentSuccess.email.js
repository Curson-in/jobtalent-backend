export const paymentSuccessEmail = (name, plan) => `
<h2>Payment Successful </h2>

<p>Hi ${name},</p>

<p>Your <strong>${plan}</strong> plan is now active.</p>

<p>
You now have access to:
<ul>
  <li>Premium job insights</li>
  <li>Priority applications</li>
  <li>Advanced messaging</li>
</ul>
</p>

<p>Thanks for trusting Curson </p>
`;
