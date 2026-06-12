function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Personal referral invitation — sent from seller Refer and Earn page */
export default function sellerReferralInvite({
  inviteeFirstName,
  inviteeVenture,
  senderName,
  sellerFirstName,
  referralLink,
  logoUrl,
}) {
  const firstName = escapeHtml(inviteeFirstName || "there");
  const venture = escapeHtml(inviteeVenture || "your business");
  const sellerNameSign = escapeHtml(sellerFirstName || senderName || "Aashansh Seller");
  const link = escapeHtml(referralLink || "#");
  const logo = escapeHtml(logoUrl || "https://aashansh.org/brand/aashansh-logo.png");
  const banner = "https://aashansh.org/brand/seller-welcome-banner.png";

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
      icon: "https://img.icons8.com/ios/100/000000/fundraising.png",
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
    <title>Invitation - Aashansh</title>
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
                            <img src="${banner}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" alt="Welcome to Aashansh - Sell to crores of customers globally - B2B & B2C">
                        </td>
                    </tr>

                    <!-- ===== BODY CONTENT ===== -->
                    <tr>
                        <td style="padding: 30px 30px 10px; color: #333333; line-height: 1.7; font-size: 14px;">
                            <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
                            
                            <p style="margin: 0 0 15px;">I hope you are doing well. I was thinking about the work you are doing with <strong>${venture}</strong>, and I believe Aashansh could really accelerate your sales.</p>
                            
                            <p style="margin: 0 0 15px;">I'm selling on Aashansh, and it's been a game-changer- free brand store, bulk orders from corporates/NGOs, nationwide B2C sales, and referral rewards that actually pay.</p>
                            
                            <p style="margin: 0 0 5px; font-weight: bold;">Why wait? You get:</p>
                            <ul style="margin: 0 0 20px; padding-left: 20px; list-style-type: disc;">
                                <li style="margin-bottom: 5px;">Zero setup cost</li>
                                <li style="margin-bottom: 5px;">Verified bulk buyer leads</li>
                                <li style="margin-bottom: 5px;">Full policy control and more</li>
                            </ul>

                            <p style="margin: 0 0 20px;">If you're open, I would be happy to introduce you to Aashansh or help you set up. It's quick and easy to set up.</p>

                            <p style="margin: 0 0 10px;">You can sign up here using my referral link: <a href="${link}" style="color: #0066cc; text-decoration: underline;">${link}</a></p>
                            
                            <p style="margin: 20px 0 15px;">I look forward to hearing from you</p>
                            
                            <p style="margin: 0 0 3px;">Warm Regards,</p>
                            <p style="margin: 0; font-weight: bold;">${sellerNameSign}</p>
                        </td>
                    </tr>

                    <!-- ===== CTA BUTTON ===== -->
                    <tr>
                        <td align="center" style="padding: 15px 30px 35px;">
                            <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="background-color: #ffd401; border-radius: 25px;">
                                        <a href="${link}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #333; text-decoration: none; border-radius: 25px;">Click to sign up</a>
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
                            <img src="${logo}" width="40" style="display: block; margin-bottom: 12px; border: 0;" alt="Aashansh">
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
