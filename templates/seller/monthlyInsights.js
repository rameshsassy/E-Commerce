import { appBaseUrl } from "../_helpers.js";

const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function monthlyInsights(seller, insights) {
  const dash = `${appBaseUrl()}/seller/analytics`;
  const sellerName = escapeHtml(seller.firstName || "there");
  const logoUrl = `${appBaseUrl()}/brand/aashansh-logo.png`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Insights - Aashansh</title>
</head>

<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: Arial, Helvetica, sans-serif;">
<center>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 4px; overflow: hidden; max-width: 600px;">

          <!-- ===== HERO BANNER ===== -->
          <tr>
            <td align="center" style="padding: 0;">
              <img src="https://aashansh.org/brand/seller-welcome-banner.png" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" alt="Welcome to Aashansh - Sell to crores of customers globally - B2B & B2C">
            </td>
          </tr>

          <!-- ===== YELLOW BANNER ===== -->
          <tr>
            <td align="center" style="padding: 0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFD600; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 14px 20px;">
                    <div style="font-size: 16px; font-weight: bold; color: #333;">Monthly Growth Insights 📈</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY COPY ===== -->
          <tr>
            <td style="padding: 25px 30px 0; color: #333; line-height: 1.7; font-size: 14px;">
              <p style="margin: 0 0 15px;">Hi ${sellerName},</p>
              <p style="margin: 0 0 15px;">Here is your growth recap and activity details for the past month on Aashansh:</p>
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333; font-size: 14px; line-height: 2;">
                <li><b>Total Orders:</b> ${insights.ordersCount ?? 0}</li>
                <li><b>Revenue:</b> ₹${(insights.revenue ?? 0).toLocaleString("en-IN")}</li>
                <li><b>Growth Note:</b> ${insights.note || "Focus on bestsellers and seasonal demand to boost performance."}</li>
              </ul>
              <p style="margin: 0 0 20px;">Hop over to your dashboard to analyze sales, download reports, and optimize listings.</p>
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
                    <a href="${dash}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #333; text-decoration: none; border-radius: 25px;">View Detailed Analytics</a>
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
