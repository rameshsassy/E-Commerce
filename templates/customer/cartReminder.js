import { appBaseUrl, wrapCustomerEmail } from "../_helpers.js";

export default function cartReminder(customerName, itemsPreview) {
  const base = appBaseUrl();
  const inner = `
    <h2>You left something in your cart 🛒</h2>
    <p>Hi ${customerName || "there"},</p>
    <p>We noticed you were interested in:</p>
    <p>${itemsPreview}</p>
    <p>Your selections are still saved. <a href="${base}/cart">Return to cart</a> when you're ready to checkout.</p>
    <p>— Team Aashansh</p>
  `;
  return wrapCustomerEmail(inner);
}
