export const appBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

export function formatShippingAddress(address) {
  if (!address) return "—";
  const line1 = address.addressLine1 || address.address || "";
  const line2 = address.addressLine2 ? `, ${address.addressLine2}` : "";
  const city = address.city || "";
  const state = address.state || "";
  const pin = address.pinCode || address.postalCode || "";
  return `${line1}${line2}, ${city}, ${state} - ${pin}`.replace(/^,\s*|,\s*-\s*$/g, "").trim() || "—";
}

/**
 * Wraps a customer email HTML snippet in the full Aashansh branded layout
 * with banner image, white background, logo, and footer.
 */
export function wrapCustomerEmail(innerHtml) {
  const base = appBaseUrl();
  const bannerUrl = "https://aashansh.org/brand/seller-welcome-banner.png";
  const logoUrl = `${base}/brand/aashansh-logo.png`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aashansh</title>
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
                            <img src="${bannerUrl}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" alt="Aashansh - Shop handcrafted products from India">
                        </td>
                    </tr>

                    <!-- ===== BODY CONTENT ===== -->
                    <tr>
                        <td style="padding: 25px 30px 20px; color: #333; line-height: 1.7; font-size: 14px;">
                            ${innerHtml}
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
