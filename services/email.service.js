import { sendEmail } from '../utils/mailer.js';

export const sendWelcomeEmail = async (user) => {
  const html = `
    <h2>Welcome to Aashansh, ${user.firstName}!</h2>
    <p>We are thrilled to have you join our purpose-driven marketplace.</p>
    <p>Explore handcrafted products, empower women artisans, and enjoy a special 10% off your first purchase using code: <b>WELCOME10</b>.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" style="padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Start Shopping</a>
  `;
  await sendEmail({ to: user.email, subject: 'Welcome to Aashansh Marketplace! 🎉', html });
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const html = `
    <h2>Order Confirmation - #${order._id.toString().slice(-8)}</h2>
    <p>Hi ${user.firstName},</p>
    <p>Thank you for your purchase! Your order has been confirmed and we are getting it ready.</p>
    <h3>Order Summary:</h3>
    <ul>
      ${order.items.map(item => `<li>${item.title} (x${item.quantity}) - Rs. ${item.price}</li>`).join('')}
    </ul>
    <p><b>Total Amount:</b> Rs. ${order.totalAmount}</p>
    <p><b>Estimated Delivery:</b> 5-7 Business Days</p>
    <p>You can track your order in your profile dashboard.</p>
  `;
  await sendEmail({ to: user.email, subject: `Order Confirmed: #${order._id.toString().slice(-8)}`, html });
};

export const sendShipmentUpdateEmail = async (user, order, trackingId, courierName, status) => {
  const html = `
    <h2>Shipment Update - #${order._id.toString().slice(-8)}</h2>
    <p>Hi ${user.firstName},</p>
    <p>Your order status has been updated to: <b>${status}</b>.</p>
    ${trackingId ? `<p><b>Tracking ID:</b> ${trackingId}</p>` : ''}
    ${courierName ? `<p><b>Courier:</b> ${courierName}</p>` : ''}
    <p>Track your package on the courier website or via your Aashansh profile.</p>
  `;
  await sendEmail({ to: user.email, subject: `Shipment Update: ${status}`, html });
};

export const sendPaymentSuccessEmail = async (user, amount, paymentId) => {
  const html = `
    <h2>Payment Successful!</h2>
    <p>Hi ${user.firstName},</p>
    <p>We have successfully received your payment of Rs. ${amount}.</p>
    <p><b>Payment ID:</b> ${paymentId}</p>
  `;
  await sendEmail({ to: user.email, subject: 'Payment Received Successfully', html });
};

export const sendRefundUpdateEmail = async (user, orderId, amount, status) => {
  const html = `
    <h2>Refund Update</h2>
    <p>Hi ${user.firstName},</p>
    <p>Your refund of Rs. ${amount} for order #${orderId.toString().slice(-8)} is currently: <b>${status}</b>.</p>
    <p>If processed, it will reflect in your original payment method within 5-7 business days.</p>
  `;
  await sendEmail({ to: user.email, subject: `Refund Update: ${status}`, html });
};