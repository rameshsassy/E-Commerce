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
  referralLink,
  logoUrl,
}) {
  const firstName = escapeHtml(inviteeFirstName || "there");
  const venture = escapeHtml(inviteeVenture || "your business");
  const sender = escapeHtml(senderName || "A seller on Aashansh");
  const link = escapeHtml(referralLink || "#");
  const logo = escapeHtml(logoUrl || "https://aashansh.org/brand/aashansh-logo.png");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation - Aashansh</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F6; font-family: Arial, sans-serif;">
<center>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F6F6F6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 4px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="${logo}" width="100" style="display: block; border: 0;" alt="Aashansh Logo">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 24px 20px; background: #f8fbff; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;">
                            <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">Join Aashansh as a Seller</p>
                            <p style="margin: 8px 0 0; color: #666; font-size: 13px;">Referred by ${sender}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 20px; color: #333333; line-height: 1.5; font-size: 14px;">
                            <p style="margin: 0 0 15px;">Hi <strong>${firstName}</strong>,</p>
                            <p style="margin: 0 0 15px;">I hope you are doing well. I was thinking about the work you are doing with <strong>${venture}</strong>, and I believe <strong>Aashansh</strong> could really help you grow your business online.</p>
                            <p style="margin: 0 0 15px;">Aashansh is a marketplace built to help sellers list products, reach buyers nationwide, and manage orders in one place. It combines a clear storefront, seller tools, and support tailored to growing Indian businesses.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fbff; border: 1px solid #e8f4fd; border-radius: 12px; margin-bottom: 15px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <div style="font-size: 14px; color: #ff6200; font-weight: bold; margin-bottom: 8px;">Why it might help you:</div>
                                        <div style="font-size: 13px; color: #333; line-height: 1.8;">
                                            <p style="margin: 0 0 6px;">&bull; Create your seller profile and list products quickly</p>
                                            <p style="margin: 0 0 6px;">&bull; Reach customers who care about quality and social impact</p>
                                            <p style="margin: 0 0 6px;">&bull; Track orders, shipments, and payouts in one dashboard</p>
                                            <p style="margin: 0;">&bull; Access KYC support and seller success guidance</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 15px;">If you're open, I would be happy to introduce you to Aashansh or help you get started with a seller account. It's quick to try and can help you focus on what matters most — growing <strong>${venture}</strong>.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${link}" style="display: inline-block; background-color: #ff6200; color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Sign Up with My Referral Link</a>
                                    </td>
                                </tr>
                            </table>

                            <h2 style="font-size: 24px; color: #333; margin: 40px 0 30px; text-align: center; font-weight: normal;">Why Aashansh</h2>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/rocket.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Marketplace visibility</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Get your products in front of buyers across India with a trusted seller storefront.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/apartment.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Bulk &amp; B2B orders</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Premium sellers can receive bulk purchase inquiries from businesses and organizations.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/money-box.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Seller analytics</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Track sales, orders, and performance insights from your seller dashboard.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/briefcase.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Premium seller tools</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Unlock advanced catalog, categories, and growth features when you upgrade.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/megaphone.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Digital reach</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Showcase your brand story and products to customers who shop online every day.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/gift--v1.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Refer &amp; Earn</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Invite other sellers and earn rewards when they join and get approved on Aashansh.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/shopping-cart--v1.png" width="50" height="50" style="margin-bottom: 15px;" alt="">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Sell products</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">List handmade, lifestyle, and specialty products and grow sales with Aashansh.</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 5px;">I look forward to hearing from you.</p>
                            <p style="margin: 0 0 5px;">Warm Regards,</p>
                            <p style="margin: 0; font-weight: bold;">${sender}</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px; border-top: 1px solid #f0f0f0;">
                            <img src="${logo}" width="80" style="margin-bottom: 15px;" alt="Aashansh Footer Logo">
                            <p style="font-size: 10px; color: #a9a9a9; margin: 0;">You are receiving this email because ${sender} invited you to join Aashansh</p>
                            <p style="font-size: 10px; color: #a9a9a9; margin-top: 5px;">&copy; Aashansh Marketplace | Made with love in India</p>
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
