import { wrapCustomerEmail } from "../_helpers.js";

export default function thankYouEmail(user, order) {
  const inner = `
    <h2>We hope you're loving your order 💛</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>Your order <b>#${order._id.toString().slice(-8)}</b> was recently delivered. We would love to hear how everything went.</p>
    <p>Leave a review on your purchases to help artisans grow — and come back anytime for more handcrafted finds.</p>
    <p>— Team Aashansh</p>
  `;
  return wrapCustomerEmail(inner);
}
