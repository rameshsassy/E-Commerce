function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Personal referral invitation — sent from customer Refer and Earn page */
export default function customerReferralInvite({
  inviteeFirstName,
  senderName,
  customerFirstName,
  referralLink,
  logoUrl,
}) {
  const firstName = escapeHtml(inviteeFirstName || "there");
  const customerNameSign = escapeHtml(customerFirstName || senderName || "Aashansh Customer");
  const link = escapeHtml(referralLink || "#");
  const logo = escapeHtml(logoUrl || "https://aashansh.org/brand/aashansh-logo.png");
  const banner = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80"; // matching app style

  function featureCard(iconUrl, title, description) {
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 15px; background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 20px;">
        <img src="${iconUrl}" width="36" height="36" style="display: block; margin: 0 auto 10px;" alt="${escapeHtml(title)}">
        <div style="font-size: 14px; font-weight: bold; color: #1E293B; margin-bottom: 4px;">${escapeHtml(title)}</div>
        <div style="font-size: 12px; color: #64748B; line-height: 1.5;">${escapeHtml(description)}</div>
      </td>
    </tr>
  </table>`;
  }

  const features = [
    {
      icon: "https://img.icons8.com/ios/100/000000/online-store.png",
      title: "Wide Product Variety",
      desc: "Discover premium handpicked products from verified vendors across the country.",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/fast-delivery.png",
      title: "Fast Delivery",
      desc: "Get your products delivered to your doorstep quickly with seamless tracking.",
    },
    {
      icon: "https://img.icons8.com/ios/100/000000/gift.png",
      title: "Loyalty Rewards",
      desc: "Earn reward credits on purchases that you can apply directly at checkout.",
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
                            <img src="${banner}" width="600" height="240" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; object-cover: cover;" alt="Welcome to Aashansh">
                        </td>
                    </tr>

                    <!-- ===== BODY CONTENT ===== -->
                    <tr>
                        <td style="padding: 30px 30px 10px; color: #333333; line-height: 1.7; font-size: 14px;">
                            <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
                            
                            <p style="margin: 0 0 15px;">I hope you are doing well. I want to invite you to join me on <strong>Aashansh</strong> - an amazing hyperlocal marketplace for high quality products!</p>
                            
                            <p style="margin: 0 0 15px;">Shopping on Aashansh has been a great experience. They offer curated products, quick delivery, secure payment options, and reward credits on every order.</p>
                            
                            <p style="margin: 0 0 20px;">Use my link to sign up, discover incredible items, and earn special rewards on your first purchase!</p>

                            <p style="margin: 0 0 10px;">Sign up here using my referral link: <a href="${link}" style="color: #6366f1; text-decoration: underline;">${link}</a></p>
                            
                            <p style="margin: 20px 0 15px;">Hope you enjoy shopping!</p>
                            
                            <p style="margin: 0 0 3px;">Warm Regards,</p>
                            <p style="margin: 0; font-weight: bold;">${customerNameSign}</p>
                        </td>
                    </tr>

                    <!-- ===== CTA BUTTON ===== -->
                    <tr>
                        <td align="center" style="padding: 15px 30px 35px;">
                            <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="background-color: #ffd401; border-radius: 25px;">
                                        <a href="${link}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #0f172a; text-decoration: none; border-radius: 25px;">Start Shopping Now</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ===== WHY AASHANSH HEADING ===== -->
                    <tr>
                        <td align="center" style="padding: 0 20px 20px;">
                            <div style="font-size: 18px; font-weight: bold; color: #333;">Why Shop on Aashansh</div>
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
                            <p style="font-size: 10px; color: #a9a9a9; margin: 0 0 4px; line-height: 1.5;">You are receiving this email because a friend invited you to Aashansh.</p>
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
