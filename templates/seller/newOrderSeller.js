import { formatShippingAddress } from "../_helpers.js";

export default function newOrderSeller(seller, customerName, customerPhone, address, order, items) {
  const addrText = formatShippingAddress(address);
  return `
    <h2>New Order Received!</h2>
    <p>Hi ${seller.firstName || "there"},</p>
    <p>You have received a new order from <b>${customerName}</b>.</p>
    <h3>Order Details (ID: #${order._id.toString().slice(-8)})</h3>
    <ul>
      ${items.map((item) => `<li>${item.title || "Product"} - Qty: ${item.quantity}</li>`).join("")}
    </ul>
    <h3>Customer Shipping Details:</h3>
    <p>
      <b>Name:</b> ${customerName}<br/>
      <b>Phone:</b> ${customerPhone}<br/>
      <b>Address:</b> ${addrText}
    </p>
    <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/seller/dashboard">Open seller dashboard</a> to manage fulfillment.</p>
    <p>Please prepare the shipment and update tracking when dispatched.</p>
  `;
}
