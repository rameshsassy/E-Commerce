import { wrapCustomerEmail } from "../_helpers.js";

export default (firstName, resetUrl) => {
  const inner = `
    <div style="text-align: center; background-color: #FFD600; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 22px; color: #333;">Reset Your Password</h1>
    </div>
    <p>Hi ${firstName},</p>
    <p>You recently requested to reset your password for your Aashansh account. Click the button below to proceed:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 35px; background-color: #FFD600; color: #333; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px;">Reset Password</a>
    </div>
    <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
    <p>This link will expire in 10 minutes.</p>
    <p>Thanks,<br>Team Aashansh</p>
  `;
  return wrapCustomerEmail(inner);
};
