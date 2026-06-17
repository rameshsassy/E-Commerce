import { wrapCustomerEmail } from "../_helpers.js";

export default function paymentSuccess(user, amount, paymentId) {
  const inner = `
    <h2>Payment Successful!</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>We have successfully received your payment of Rs. ${amount}.</p>
    <p><b>Payment ID:</b> ${paymentId}</p>
  `;
  return wrapCustomerEmail(inner);
}
