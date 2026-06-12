function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Personal referral follow-up emails - dynamically formats steps 1 to 4 */
export default function sellerReferralFollowUp({
  step,
  inviteeFirstName,
  inviteeVenture,
  referralCode,
  referralLink,
  logoUrl,
}) {
  const firstName = escapeHtml(inviteeFirstName || "there");
  const venture = escapeHtml(inviteeVenture || "your business");
  const refCode = escapeHtml(referralCode || "");
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

  let bodyHtml = "";

  if (step === 1) {
    bodyHtml = `
      <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin: 0 0 15px;">I'm following up on my last email because I truly believe Aashansh could transform your business.</p>
      <p style="margin: 0 0 15px;">I believe this is a once-in-a-lifetime opportunity. The best part is that, apart from individual customers PAN India, you get bulk buyer inbound and outbound leads, and get awesome rewards.</p>
      
      <p style="margin: 0 0 5px; font-weight: bold;">You're leaving money on idle by not joining:</p>
      <ol style="margin: 0 0 20px; padding-left: 20px;">
          <li style="margin-bottom: 5px;">Free brand store (zero setup cost)</li>
          <li style="margin-bottom: 5px;">Bulk orders that pay 5x more than regular sales</li>
          <li style="margin-bottom: 5px;">Referral rewards that actually add up</li>
      </ol>

      <p style="margin: 0 0 15px;">I invite you to grab this once-in-a-lifetime opportunity. Once Aashansh hits millions of sellers, bulk leads get divided—and you'll lose priority access.</p>
      <p style="margin: 0 0 20px;">Act now: <a href="${link}" style="color: #0066cc; text-decoration: underline;">${link}</a></p>
      <p style="margin: 0; font-weight: bold;">Let's grow together!</p>
    `;
  } else if (step === 2) {
    bodyHtml = `
      <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin: 0 0 15px;">I'm sending this because I don't want you to miss out on being an early Aashansh seller.</p>
      <p style="margin: 0 0 15px;">Right now, Aashansh is hand-picking sellers. Once they hit their seller target, this advantage disappears. No way back.</p>
      
      <p style="margin: 0 0 5px; font-weight: bold;">Why wait? You could be:</p>
      <ol style="margin: 0 0 20px; padding-left: 20px;">
          <li style="margin-bottom: 5px;">Selling nationwide with zero setup cost</li>
          <li style="margin-bottom: 5px;">Getting bulk orders that regular sellers miss</li>
          <li style="margin-bottom: 5px;">Earning referral rewards while helping others join</li>
      </ol>

      <p style="margin: 0 0 15px;">Don't miss on the fantastic opportunity. Use my referral code <strong>${refCode}</strong></p>
      <p style="margin: 0 0 20px;">Join now using the referral link: <a href="${link}" style="color: #0066cc; text-decoration: underline;">${link}</a></p>
      <p style="margin: 0;">I'm here to help if you need setup assistance.</p>
    `;
  } else if (step === 3) {
    bodyHtml = `
      <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin: 0 0 15px;">I keep thinking about <strong>${venture}</strong> and how Aashansh could multiply your sales in weeks.</p>
      <p style="margin: 0 0 15px;">Here's the truth: This opportunity won't last. Aashansh is rolling out exclusive bulk buyer programs for early sellers. Once they cap enrollment, you probably lose exclusive access to bulk orders.</p>
      
      <p style="margin: 0 0 5px; font-weight: bold;">Dont miss on the wonderful opportunity:</p>
      <ol style="margin: 0 0 20px; padding-left: 20px;">
          <li style="margin-bottom: 5px;">Bulk leads/orders worth 10x regular sales</li>
          <li style="margin-bottom: 5px;">Nationwide Individual customers</li>
          <li style="margin-bottom: 5px;">Awesome Referral rewards</li>
      </ol>

      <p style="margin: 0 0 15px;">You're one click away from growth.</p>
      <p style="margin: 0 0 20px;">Sign up: <a href="${link}" style="color: #0066cc; text-decoration: underline;">${link}</a></p>
      <p style="margin: 0; font-style: italic;">No pressure - just opportunity.</p>
    `;
  } else if (step === 4) {
    bodyHtml = `
      <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin: 0 0 15px;">Aashansh is growing rapidly, and I keep thinking that Aashansh is a fantastic opportunity that could multiply your sales not just from individual customers but bulk orders too.</p>
      
      <p style="margin: 0 0 5px; font-weight: bold;">Dont miss on the wonderful opportunity:</p>
      <ul style="margin: 0 0 20px; padding-left: 20px; list-style-type: disc;">
          <li style="margin-bottom: 5px;">Bulk leads/orders worth 10x regular sales</li>
          <li style="margin-bottom: 5px;">Nationwide Individual customers</li>
          <li style="margin-bottom: 5px;">Awesome Referral rewards</li>
      </ul>

      <p style="margin: 0 0 15px;">You're one click away from growth.</p>
      <p style="margin: 0 0 20px;">Sign up: <a href="${link}" style="color: #0066cc; text-decoration: underline;">${link}</a></p>
      <p style="margin: 0; font-style: italic;">No pressure - just opportunity.</p>
    `;
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Follow Up ${step} - Aashansh</title>
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
                            ${bodyHtml}
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
