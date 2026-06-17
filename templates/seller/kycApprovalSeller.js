const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Build a single "Why Aashansh" feature card (table-based for email clients).
 */
function featureCard(iconUrl, title, description) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 12px; margin-bottom: 15px; background-color: #FFD600;">
  <tr>
    <td align="center" style="padding: 25px 20px;">
      <img src="${iconUrl}" width="40" height="40" style="display: block; margin: 0 auto 12px;" alt="${escapeHtml(title)}">
      <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">${escapeHtml(title)}</div>
      <div style="font-size: 13px; color: #555; line-height: 1.5;">${escapeHtml(description)}</div>
    </td>
  </tr>
</table>`;
}

/**
 * Premium "KYC Approved" email for sellers.
 * Sent when the admin verifies and approves the seller's KYC documents.
 *
 * @param {string} name          - seller's first name
 * @param {string} dashboardLink - URL to the seller dashboard
 */
export default function kycApprovalSeller(name, dashboardLink) {
  const firstName = escapeHtml(name || "there");

  const features = [
    {
      icon: "https://img.icons8.com/ios/100/000000/conference-call.png",
      title: "B2B Sales",
      desc: "Connect with bulk buyers; corporates, schools, colleges, and other institutions",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/online-store.png",
      title: "B2C Sales",
      desc: "Sell and ship directly to customers nationwide with seamless automation",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/low-price.png",
      title: "Low Margin",
      desc: "Lower margins, higher profits through smarter pricing, efficient operations, and stronger sales volume.",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/settings--v1.png",
      title: "Policy control",
      desc: "Connect with bulk buyers; corporates, schools, colleges, and other institutions",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/share-2.png",
      title: "Refer and Earn",
      desc: "Share your store, invite fellow sellers and earn larger rewards for successful referrals.",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/commercial.png",
      title: "Digital Advertising",
      desc: "Promote products via targeted ads, social campaigns, and analytics",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/money-bag.png",
      title: "Business Fundraising",
      desc: "Support in funding options, grants, and investor connects for growth",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/tax.png",
      title: "Financial Compliance",
      desc: "Simplify tax, invoicing, and regulatory compliance",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/shop.png",
      title: "Brand Store",
      desc: "Create free personal brand store with customisable product listings and analytics.",
    },
  ];

  const featureCardsHtml = features
    .map((f) => featureCard(f.icon, f.title, f.desc))
    .join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Approved - Aashansh</title>
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
                    <div style="font-size: 16px; font-weight: bold; color: #333;">KYC Successfully Approved | Start Selling</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY COPY ===== -->
          <tr>
            <td style="padding: 25px 30px 0; color: #333; line-height: 1.7; font-size: 14px;">
              <p style="margin: 0 0 15px;">Hi ${firstName}</p>

              <p style="margin: 0 0 15px;">Great news - your KYC is officially approved!</p>

              <p style="margin: 0 0 15px;">You're now verified, ready to list products, and cleared to start selling on Aashansh.</p>

              <p style="margin: 0 0 10px; font-weight: bold;">What's next?</p>

              <ul style="margin: 0 0 15px; padding-left: 20px; color: #333; font-size: 14px; line-height: 2;">
                <li>Create your free brand store</li>
                <li>List your products</li>
                <li>Start taking orders</li>
                <li>Withdraw earnings securely</li>
                <li>Refer and earn bigger rewards</li>
              </ul>

              <p style="margin: 0 0 15px;">Head to your dashboard to get started. We're thrilled to have you on board and can't wait to see your business grow.</p>

              <p style="margin: 0 0 20px;">Welcome aboard—let's make some sales!</p>
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
                    <a href="${dashboardLink}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #333; text-decoration: none; border-radius: 25px;">Click to visit Dashboard</a>
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
              ${featureCardsHtml}
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td align="center" style="padding: 25px 30px; border-top: 1px solid #e8e8e8;">
              <img src="https://aashansh.org/brand/aashansh-logo.png" width="40" style="display: block; margin-bottom: 12px; border: 0;" alt="Aashansh">
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
