export default function orderConfirmation(user, order) {
  return `
    <h2>Order Confirmation - #${order._id.toString().slice(-8)}</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>Thank you for your purchase! Your order has been confirmed and we are getting it ready.</p>
    <h3>Order Summary:</h3>
    <ul>
      ${order.items.map((item) => `<li>${item.title} (x${item.quantity}) - Rs. ${item.price}</li>`).join("")}
    </ul>
    <p><b>Total Amount:</b> Rs. ${order.totalAmount}</p>
    <p><b>Estimated Delivery:</b> 5-7 Business Days</p>
    <p>You can track your order in your profile dashboard.</p>
  `;
}
