import { appBaseUrl } from "../_helpers.js";

const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Premium seller upgrade confirmation */
export default function premiumUpgrade(name, dashboardLink) {
  const sellerName = escapeHtml(name || "there");
  const logoUrl = `${appBaseUrl()}/brand/aashansh-logo.png`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Active - Aashansh</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F6; font-family: Arial, Helvetica, sans-serif;">
<center>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F6F6F6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 4px; overflow: hidden; max-width: 600px;">

          <!-- ===== LOGO ===== -->
          <tr>
            <td align="center" style="padding: 25px 0 15px;">
              <img src="${logoUrl}" width="50" style="display: block; border: 0;" alt="Aashansh Logo">
            </td>
          </tr>

          <!-- ===== YELLOW BANNER ===== -->
          <tr>
            <td align="center" style="padding: 0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFD600; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 14px 20px;">
                    <div style="font-size: 16px; font-weight: bold; color: #333;">Premium Seller Activated ⭐</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY COPY ===== -->
          <tr>
            <td style="padding: 25px 30px 0; color: #333; line-height: 1.7; font-size: 14px;">
              <p style="margin: 0 0 15px;">Congratulations ${sellerName}!</p>
              <p style="margin: 0 0 15px;">Your <b>Aashansh Premium</b> subscription is officially active. You have unlocked powerful tools to scale your business:</p>
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333; font-size: 14px; line-height: 2;">
                <li>📦 <b>Bulk purchase</b> option enabled on products</li>
                <li>🤝 Direct <b>B2B inquiries</b> and wholesale leads</li>
                <li>💬 Negotiate shipping, quantity, and custom terms</li>
                <li>🏅 <b>Premium seller badge</b> and trust with buyers</li>
              </ul>
              <p style="margin: 0 0 20px;">Head over to your dashboard to set up your bulk preferences and start connecting with institutional buyers.</p>
            </td>
          </tr>

          <!-- ===== SIGN-OFF ===== -->
          <tr>
            <td style="padding: 0 30px 25px; color: #333; line-height: 1.7; font-size: 14px;">
              <p style="margin: 0 0 3px;">Warm Regards</p>
              <p style="margin: 0 0 3px; font-weight: bold;">Team Aashansh</p>
              <p style="margin: 0; color: #666; font-size: 13px; font-style: italic;">India's movement toward conscious, inclusive, and impactful consumption.</p>
            </td>
          </tr>

          <!-- ===== CTA BUTTON ===== -->
          <tr>
            <td align="center" style="padding: 0 30px 35px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #FFD600; border-radius: 25px;">
                    <a href="${dashboardLink}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #333; text-decoration: none; border-radius: 25px;">Open your seller dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td align="center" style="padding: 25px 30px; border-top: 1px solid #e8e8e8;">
              <img src="${logoUrl}" width="40" style="display: block; margin-bottom: 12px; border: 0;" alt="Aashansh">
              <div style="width: 80px; height: 1px; background-color: #e0e0e0; margin: 0 auto 12px;"></div>
              <p style="font-size: 10px; color: #a9a9a9; margin: 0 0 4px; line-height: 1.5;">You are receiving this email because you signed up on the Aashansh e-commerce aggregator.</p>
              <p style="font-size: 10px; color: #a9a9a9; margin: 0;">© Funds And Trail Private Limited (Aashansh). All rights reserved | Made With Love In India</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</center>
</body>
</html>`;
}
