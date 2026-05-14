export default function paymentSuccess(user, amount, paymentId) {
  return `
    <h2>Payment Successful!</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>We have successfully received your payment of Rs. ${amount}.</p>
    <p><b>Payment ID:</b> ${paymentId}</p>
  `;
}
