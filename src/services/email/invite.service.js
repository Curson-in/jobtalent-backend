import { sendEmail } from './email.service.js';

/**
 * Sends a direct invitation email to a candidate.
 * * @param {string} candidateEmail - The candidate's email address.
 * @param {string} candidateName - The candidate's first name.
 * @param {string} companyName - The name of the company hiring.
 * @param {string} employerEmail - The recruiter's direct email address.
 */
export const sendCandidateInvite = async (candidateEmail, candidateName, companyName, employerEmail) => {
  const subject = `Interview Invitation from ${companyName}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff;">
      
      <h2 style="color: #2563eb; margin-top: 0;">Let's Connect!</h2>
      
      <p style="font-size: 16px; color: #333; line-height: 1.5;">
        Hi <strong>${candidateName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #333; line-height: 1.5;">
        I came across your profile on <strong>Curson</strong> and was impressed by your experience. 
        At <strong>${companyName}</strong>, we are currently looking for talented individuals with your skillset and I believe you would be a great fit for our team.
      </p>

      <p style="font-size: 16px; color: #333; line-height: 1.5;">
        I would love to discuss next steps with you directly.
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #555; font-size: 14px;">You can reach me directly at:</p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
          <a href="mailto:${employerEmail}" style="color: #2563eb; text-decoration: none;">${employerEmail}</a>
        </p>
      </div>

      <p style="font-size: 14px; color: #666;">
        Simply <strong>reply to this email</strong> with your Resume.
      </p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        Sent via Curson • Connecting Talent with Opportunity
      </p>
    </div>
  `;

  try {
    await sendEmail({ 
      to: candidateEmail, 
      replyTo: employerEmail, // 🔥 Critical: Candidate replies go to Recruiter, not your app
      subject: subject, 
      html: html 
    });
    return true;
  } catch (error) {
    console.error("Invite Email Failed:", error);
    return false;
  }
};