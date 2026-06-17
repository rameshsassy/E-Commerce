import { wrapCustomerEmail } from "../_helpers.js";

export default function refundUpdate(user, orderId, amount, status) {
  const inner = `
    <h2>Refund Update</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>Your refund of Rs. ${amount} for order #${orderId.toString().slice(-8)} is currently: <b>${status}</b>.</p>
    <p>If processed, it will reflect in your original payment method within 5-7 business days.</p>
  `;
  return wrapCustomerEmail(inner);
}
