import { appBaseUrl } from "../_helpers.js";

const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Unified subscriber lifecycle notification email template matching the visual 9-box design */
export default function subscriptionNotification(name, type, dashboardLink) {
  const sellerName = escapeHtml(name || "there");
  const logoUrl = `${appBaseUrl()}/brand/aashansh-logo.png`;

  let bannerText = "Subscription Renewal";
  let contentHtml = "";

  if (type === "30_days") {
    bannerText = "30 Days Left";
    contentHtml = `
      <p style="margin: 0 0 15px; font-weight: bold; font-size: 15px;">Hi ${sellerName},</p>
      <p style="margin: 0 0 15px;">A quick heads-up: your Aashansh subscription expires in 30 days.</p>
      <p style="margin: 0 0 15px;">Thank you for trusting us with your mission — your platform is helping connect businesses, customers, and opportunities more effectively every day.</p>
      <p style="margin: 0 0 15px;">Before renewal time arrives, we encourage you to review your dashboard performance, sales insights, customer engagement, and business growth metrics.</p>
      <p style="margin: 0 0 15px;">Renewing early ensures uninterrupted access to all premium features and services available through Aashansh.</p>
      <p style="margin: 0 0 15px;">If you have any questions regarding renewal options or subscription plans, our support team is always here to help.</p>
      <p style="margin: 0 0 25px;">Keep growing with Aashansh and continue building meaningful business connections.</p>
    `;
  } else if (type === "15_days") {
    bannerText = "15 Days Left";
    contentHtml = `
      <p style="margin: 0 0 15px; font-weight: bold; font-size: 15px;">Hi ${sellerName},</p>
      <p style="margin: 0 0 15px;">Only 15 days remain before your Aashansh subscription expires.</p>
      <p style="margin: 0 0 15px;">We appreciate your participation in our growing business community and the trust you place in our platform.</p>
      <p style="margin: 0 0 15px;">Your subscription remains active, giving you full access to your dashboard, customer analytics, sales tools, and business growth features.</p>
      <p style="margin: 0 0 15px;">To avoid any interruption in service, we recommend renewing your subscription before the expiry date.</p>
      <p style="margin: 0 0 15px;">Continue leveraging the tools and opportunities designed to help your business succeed.</p>
      <p style="margin: 0 0 25px;">Thank you for being part of the Aashansh community.</p>
    `;
  } else if (type === "10_days") {
    bannerText = "10 Days Left";
    contentHtml = `
      <p style="margin: 0 0 15px; font-weight: bold; font-size: 15px;">Hi ${sellerName},</p>
      <p style="margin: 0 0 15px;">Your Aashansh subscription will expire in just 10 days.</p>
      <p style="margin: 0 0 15px;">This is a great time to review your business performance through your dashboard, including customer engagement, sales trends, and platform activity.</p>
      <p style="margin: 0 0 15px;">Remember, your subscription provides access to valuable business tools that help increase visibility, streamline operations, and support growth.</p>
      <p style="margin: 0 0 15px;">Renew now to continue enjoying uninterrupted access to all premium features.</p>
      <p style="margin: 0 0 25px;">We look forward to supporting your business journey.</p>
    `;
  } else if (type === "5_days") {
    bannerText = "5 Days Left";
    contentHtml = `
      <p style="margin: 0 0 15px; font-weight: bold; font-size: 15px;">Hi ${sellerName},</p>
      <p style="margin: 0 0 15px;">Reminder: your Aashansh subscription expires in 5 days.</p>
      <p style="margin: 0 0 15px;">Your account is currently active, and you can continue managing your products, sales, customers, and business operations through your dashboard.</p>
      <p style="margin: 0 0 15px;">To avoid losing access to premium features and business opportunities, we encourage you to renew your subscription today.</p>
      <p style="margin: 0 0 15px;">A quick renewal ensures your growth momentum continues without interruption.</p>
      <p style="margin: 0 0 25px;">Renew today and remain part of India's movement toward conscious, inclusive, and impactful business growth.</p>
    `;
  } else if (type === "1_day") {
    bannerText = "1 Day Left";
    contentHtml = `
      <p style="margin: 0 0 15px; font-weight: bold; font-size: 15px;">Hi ${sellerName},</p>
      <p style="margin: 0 0 15px;">Important: your Aashansh subscription expires tomorrow.</p>
      <p style="margin: 0 0 15px;">To continue enjoying uninterrupted access to your dashboard, analytics, sales tools, and business services, please renew your subscription within the next 24 hours.</p>
      <p style="margin: 0 0 15px;">After expiry, premium features and platform benefits may become unavailable until your subscription is renewed.</p>
      <p style="margin: 0 0 15px;">Don't miss out on valuable opportunities to grow your business and connect with customers.</p>
      <p style="margin: 0 0 25px;">Renew today and keep your business moving forward.</p>
    `;
  } else if (type === "expired") {
    bannerText = "Subscription Ended";
    contentHtml = `
      <p style="margin: 0 0 15px; font-weight: bold; font-size: 15px;">Hi ${sellerName},</p>
      <p style="margin: 0 0 15px;">Your Aashansh subscription has expired.</p>
      <p style="margin: 0 0 15px;">As a result, access to certain premium features, advanced analytics, business tools, and growth opportunities may now be limited.</p>
      <p style="margin: 0 0 15px;">The good news is that you can reactivate your subscription at any time and continue where you left off.</p>
      <p style="margin: 0 0 25px;">Renew your subscription today to restore full access and continue growing your business through the Aashansh platform.</p>
      <p style="margin: 0 0 25px;">We value your association with us and look forward to supporting your success again.</p>
    `;
  }

  // 9 Why Aashansh premium features
  const features = [
    {
      emoji: "🏢",
      title: "B2B Sales",
      desc: "Connect with bulk buyers; corporates, schools, colleges, and other institutions"
    },
    {
      emoji: "🚚",
      title: "B2C Sales",
      desc: "Sell and ship directly to customers nationwide with seamless automation"
    },
    {
      emoji: "📉",
      title: "Low Margin",
      desc: "Lower margins, higher profits through smarter pricing, efficient operations, and stronger sales volume."
    },
    {
      emoji: "🛡️",
      title: "Policy control",
      desc: "Connect with bulk buyers; corporates, schools, colleges, and other institutions"
    },
    {
      emoji: "🤝",
      title: "Refer and Earn",
      desc: "Share your store, invite fellow sellers and earn larger rewards for successful referrals."
    },
    {
      emoji: "📊",
      title: "Digital Advertising",
      desc: "Promote products via targeted ads, social campaigns, and analytics"
    },
    {
      emoji: "💰",
      title: "Business Fundraising",
      desc: "Support in funding options, grants, and investor connects for growth"
    },
    {
      emoji: "📑",
      title: "Financial Compliance",
      desc: "Simplify tax, invoicing, and regulatory compliance"
    },
    {
      emoji: "🏪",
      title: "Brand Store",
      desc: "Create free personal brand store with customisable product listings and analytics."
    }
  ];

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bannerText} - Aashansh</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: Arial, Helvetica, sans-serif;">
<center>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 4px; overflow: hidden; max-width: 600px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

          <!-- ===== LOGO ===== -->
          <tr>
            <td align="center" style="padding: 25px 0 15px;">
              <img src="${logoUrl}" width="50" style="display: block; border: 0;" alt="Aashansh Logo">
            </td>
          </tr>

          <!-- ===== YELLOW BANNER ===== -->
          <tr>
            <td align="center" style="padding: 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFD600; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 14px 20px;">
                    <div style="font-size: 18px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">${bannerText}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY COPY ===== -->
          <tr>
            <td style="padding: 25px 30px 20px; color: #333; line-height: 1.6; font-size: 14px; text-align: left;">
              ${contentHtml}
              
              <p style="margin: 0 0 3px;">Warm Regards</p>
              <p style="margin: 0 0 3px; font-weight: bold;">Team Aashansh</p>
              <p style="margin: 0; color: #FF3B30; font-weight: bold;">Crafted with Purpose, Delivered with Heart ❤️</p>
            </td>
          </tr>

          <!-- ===== CTA BUTTON ===== -->
          <tr>
            <td align="center" style="padding: 0 30px 30px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #FFD600; border-radius: 25px;">
                    <a href="${dashboardLink}" target="_blank" style="display: inline-block; padding: 12px 35px; font-size: 14px; font-weight: bold; color: #333; text-decoration: none; border-radius: 25px; text-transform: uppercase;">Click to visit Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== WHY AASHANSH HEADING ===== -->
          <tr>
            <td align="center" style="padding: 20px 30px 10px; border-top: 1px solid #EEEEEE;">
              <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">Why Aashansh</h3>
            </td>
          </tr>

          <!-- ===== WHY AASHANSH FEATURES ===== -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${features.map(f => `
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #FFD600; border-radius: 8px; background-color: #FFD600;">
                      <tr>
                        <td align="center" style="padding: 15px 20px;">
                          <div style="font-size: 24px; margin-bottom: 6px;">${f.emoji}</div>
                          <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;">${f.title}</div>
                          <div style="font-size: 12px; color: #666; line-height: 1.5;">${f.desc}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join("")}
              </table>
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td align="center" style="padding: 25px 30px; border-top: 1px solid #E8E8E8; background-color: #FAFAFA;">
              <img src="${logoUrl}" width="40" style="display: block; margin-bottom: 12px; border: 0;" alt="Aashansh Logo">
              <div style="width: 80px; height: 1px; background-color: #E0E0E0; margin: 0 auto 12px;"></div>
              <p style="font-size: 10px; color: #A9A9A9; margin: 0 0 4px; line-height: 1.5;">You are receiving this email because you signed up on the Aashansh e-commerce aggregator</p>
              <p style="font-size: 10px; color: #A9A9A9; margin: 0; line-height: 1.5;">© Funds And Trail Private Limited (Aashansh) | All rights reserved | Made With Love In India</p>
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
