export const welcomeEmail = (name) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to Curson</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f7fa; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="padding:32px 40px; background-color:#0f172a;">
                <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">
                  Welcome to Curson
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 16px; font-size:15px; color:#111827;">
                  Hi ${name},
                </p>

                <p style="margin:0 0 20px; font-size:15px; color:#374151; line-height:1.6;">
                  Your Curson account has been successfully created. You now have access to a platform designed to help you move faster and smarter in your job search.
                </p>

                <p style="margin:0 0 12px; font-size:15px; color:#111827; font-weight:600;">
                  With Curson, you can:
                </p>

                <ul style="margin:0 0 24px 18px; padding:0; color:#374151; font-size:14.5px; line-height:1.6;">
                  <li>Explore verified and relevant job opportunities</li>
                  <li>Build a professional profile that stands out</li>
                  <li>Increase your visibility to recruiters and hiring teams</li>
                </ul>

                <a
                  href="https://curson.in"
                  style="
                    display:inline-block;
                    padding:12px 22px;
                    background-color:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    font-size:14px;
                    font-weight:600;
                    border-radius:6px;
                  "
                >
                  Go to Dashboard
                </a>

                <p style="margin:32px 0 0; font-size:14px; color:#6b7280; line-height:1.6;">
                  If you have any questions or need support, our team is always here to help.
                </p>

                <p style="margin:24px 0 0; font-size:14px; color:#111827;">
                  Regards,<br />
                  <strong>Team Curson</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px; background-color:#f9fafb; text-align:center;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  © 2026 Curson. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
