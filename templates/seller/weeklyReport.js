import { appBaseUrl } from "../_helpers.js";

export default function weeklyReport(seller, summary) {
  const dash = `${appBaseUrl()}/seller/dashboard`;
  const logoUrl = `${appBaseUrl()}/brand/aashansh-logo.png`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Aashansh Recap</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F6; font-family: Arial, Helvetica, sans-serif;">
<center>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F6F6F6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 4px; overflow: hidden; max-width: 600px; border: 1px solid #e8e8e8;">
          
          <!-- ===== LOGO ===== -->
          <tr>
            <td align="center" style="padding: 25px 0 15px;">
              <img src="${logoUrl}" width="50" style="display: block; border: 0;" alt="Aashansh Logo">
            </td>
          </tr>

          <!-- ===== YELLOW BANNER ===== -->
          <tr>
            <td align="center" style="padding: 0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFD600; border-radius: 4px;">
                <tr>
                  <td align="center" style="padding: 14px 20px;">
                    <div style="font-size: 16px; font-weight: bold; color: #000; letter-spacing: 0.5px;">Weekly Wrap | Aashansh</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY COPY ===== -->
          <tr>
            <td style="padding: 25px 30px 0; color: #333; line-height: 1.7; font-size: 14px;">
              <p style="margin: 0 0 15px;">Hi ${seller.firstName || "there"},</p>

              <p style="margin: 0 0 15px;">Here's your weekly victory lap on Aashansh:</p>

              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333; font-size: 14px; line-height: 2;">
                <li>B2C Orders this week: <strong>${summary.b2cOrdersCount ?? 0}</strong></li>
                <li>Bulk orders: <strong>${summary.bulkOrdersCount ?? 0}</strong></li>
                <li>Referrals: You invited <strong>${summary.referralsCount ?? 0}</strong> new sellers</li>
                <li>Earnings from referrals: <strong>₹ ${summary.referralEarnings ?? 0}/-</strong></li>
              </ul>

              <p style="margin: 0 0 15px;">Whether you're crushing it or just getting started, every order counts. Keep listing, keep referring, and watch your store grow.</p>
              
              <p style="margin: 0 0 25px;">Hop into your dashboard for full details, earnings, and referral rewards.</p>
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
            <td align="center" style="padding: 10px 30px 45px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #FFD600; border-radius: 4px;">
                    <a href="${dash}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #000; text-decoration: none; border-radius: 4px; background-color: #FFD600; border: 1px solid #FFD600;">Click to visit Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== WHY AASHANSH HEADING ===== -->
          <tr>
            <td align="center" style="padding: 0 20px 20px;">
              <div style="font-size: 18px; font-weight: bold; color: #333;">Why Aashansh</div>
            </td>
          </tr>

          <!-- ===== FEATURE CARDS ===== -->
          <tr>
            <td style="padding: 0 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/conference-call.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="B2B Sales">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">B2B Sales</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Connect with bulk buyers; corporates, schools, colleges, and other institutions</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/online-store.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="B2C Sales">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">B2C Sales</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Sell and ship directly to customers nationwide with seamless automation</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/low-price.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Low Margin">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Low Margin</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Lower margins, higher profits through smarter pricing, efficient operations, and stronger sales volume.</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/settings--v1.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Policy control">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Policy control</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Connect with bulk buyers; corporates, schools, colleges, and other institutions</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/share-2.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Refer and Earn">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Refer and Earn</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Share your store, invite fellow sellers and earn larger rewards for successful referrals.</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/commercial.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Digital Advertising">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Digital Advertising</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Promote products via targeted ads, social campaigns, and analytics</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/fundraising.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Business Fundraising">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Business Fundraising</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Support in funding options, grants, and investor connects for growth</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/tax.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Financial Compliance">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Financial Compliance</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Simplify tax, invoicing, and regulatory compliance</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <img src="https://img.icons8.com/ios/100/000000/shop.png" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="Brand Store">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">Brand Store</div>
                    <div style="font-size: 13px; color: #555; line-height: 1.5;">Create free personal brand store with customisable product listings and analytics.</div>
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
              <p style="font-size: 10px; color: #a9a9a9; margin: 0 0 4px; line-height: 1.5;">You are receiving this email because you signed up on the Aashansh e-commerce aggregator</p>
              <p style="font-size: 10px; color: #a9a9a9; margin: 0;">&copy; Funds And Toil Private Limited (Aashansh) | All rights reserved | Made With Love In India</p>
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
