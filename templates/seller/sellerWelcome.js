/** Seller welcome after signup (free + premium sellers) */
export default function sellerWelcome(name, _dashboardLink) {
  const firstName = String(name || "there")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Aashansh</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F6; font-family: Arial, sans-serif;">
<center>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F6F6F6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 4px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://aashansh.org/brand/aashansh-logo.png" width="100" style="display: block; border: 0;" alt="Aashansh Logo">
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <img src="https://aashansh.org/brand/aashansh-logo.png" width="600" style="display: block; width: 100%; border: 0;" alt="Aashansh Banner">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 20px; color: #333333; line-height: 1.5; font-size: 14px;">
                            <p style="margin: 0 0 15px;">🎉 Woohoo, ${firstName}!</p>
                            <p style="margin: 0 0 15px;">You are officially part of the Aashansh family! 🎉</p>
                            <p style="margin: 0 0 15px;">
                                Thank you for signing up! We are thrilled to have you aboard. Whether you are an NGO hero, startup rockstar, or passionate individual ready to fund your big dreams. Your journey to epic fundraising just launched! 🚀
                            </p>
                            <p style="margin: 0 0 15px;"><strong>Next up:</strong> From your dashboard, verify your email, upload KYC &amp; project details. We will connect soon for your success roadmap!</p>
                            <p style="margin: 0 0 15px;">Let’s make fundraising SIMPLE &amp; FUN! 💥</p>
                            <p style="margin: 0 0 5px;">Team Aashansh</p>
                            <p style="margin: 0; color: #666;">Advisory | Network | Capital</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 20px 40px;">
                            <h2 style="font-size: 24px; color: #333; margin-bottom: 25px; font-weight: normal;">As next steps</h2>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fbff; border: 1px solid #e8f4fd; border-radius: 12px; margin-bottom: 15px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50"><img src="https://img.icons8.com/fluency/96/ok--v1.png" width="45" height="45" alt="Verify email"></td>
                                                <td style="padding-left: 15px;"><div style="font-size: 18px; color: #333;">Verify your email through dashboard</div></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fbff; border: 1px solid #e8f4fd; border-radius: 12px; margin-bottom: 15px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50"><img src="https://img.icons8.com/fluency/96/badge.png" width="45" height="45" alt="Upload KYC"></td>
                                                <td style="padding-left: 15px;"><div style="font-size: 18px; color: #333;">Upload your KYC</div></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fbff; border: 1px solid #e8f4fd; border-radius: 12px; margin-bottom: 15px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50"><img src="https://img.icons8.com/fluency/96/documents.png" width="45" height="45" alt="Project details"></td>
                                                <td style="padding-left: 15px;"><div style="font-size: 18px; color: #333;">Upload project details</div></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fbff; border: 1px solid #e8f4fd; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50"><img src="https://img.icons8.com/fluency/96/handshake.png" width="45" height="45" alt="Meeting"></td>
                                                <td style="padding-left: 15px;"><div style="font-size: 18px; color: #333;">We will reach out for a quick meeting</div></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 20px 40px;">
                            <h2 style="font-size: 24px; color: #333; margin-bottom: 30px; font-weight: normal;">Why Aashansh</h2>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/rocket.png" width="50" height="50" style="margin-bottom: 15px;" alt="Crowdfunding">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Crowdfunding campaigns</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Launch epic crowdfunding quests – turn your innovative ideas into reality in a short span of time and build long-term pipeline</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/apartment.png" width="50" height="50" style="margin-bottom: 15px;" alt="CSR campaigns">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">CSR campaigns</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Hook corporates into CSR goldmines – they will CSR-sprint to fund your mission!</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/money-box.png" width="50" height="50" style="margin-bottom: 15px;" alt="Grant campaigns">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Grant campaigns</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Raise grants faster than ever – our tools make grant-hunting simple and wildly successful!</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #ff6200; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/megaphone.png" width="50" height="50" style="margin-bottom: 15px;" alt="Digital advertising">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Digital advertising</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Blast cause and products with digital ads that convert scrollers to supporters!</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #ff6200; border-radius: 12px;">
                                <tr>
                                    <td align="center" style="padding: 25px;">
                                        <img src="https://img.icons8.com/fluency/96/shopping-cart--v1.png" width="50" height="50" style="margin-bottom: 15px;" alt="Sell products">
                                        <h4 style="font-size: 20px; color: #333; margin: 0 0 10px;">Sell products</h4>
                                        <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.5; font-style: italic;">Peddle passion products and watch sales skyrocket effortlessly!</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px; border-top: 1px solid #f0f0f0;">
                            <img src="https://aashansh.org/brand/aashansh-logo.png" width="80" style="margin-bottom: 15px;" alt="Aashansh Footer Logo">
                            <p style="font-size: 10px; color: #a9a9a9; margin: 0;">You are receiving this email because you signed up on Aashansh platform</p>
                            <p style="font-size: 10px; color: #a9a9a9; margin-top: 5px;">© Aashansh Marketplace | Made with love in India</p>
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
