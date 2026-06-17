import { wrapCustomerEmail } from "../_helpers.js";

/** When shipment is shipped / out for delivery */
export default function dispatchEmail(user, order, trackingId, courierName, status) {
  const inner = `
    <h2>Your order is on the way 🚚</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>Great news — your package for order <b>#${order._id.toString().slice(-8)}</b> is now <b>${status}</b>.</p>
    ${trackingId ? `<p><b>Tracking ID:</b> ${trackingId}</p>` : ""}
    ${courierName ? `<p><b>Courier:</b> ${courierName}</p>` : ""}
    <p>You can track progress from your Aashansh account or the courier's website.</p>
    <p>Thank you for shopping with us.</p>
    <p>— Team Aashansh</p>
  `;
  return wrapCustomerEmail(inner);
}
