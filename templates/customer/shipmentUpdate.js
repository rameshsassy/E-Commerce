import { wrapCustomerEmail } from "../_helpers.js";

/** Generic shipment status change (non-dispatch) */
export default function shipmentUpdate(user, order, trackingId, courierName, status) {
  const inner = `
    <h2>Shipment Update - #${order._id.toString().slice(-8)}</h2>
    <p>Hi ${user.firstName || "there"},</p>
    <p>Your order status has been updated to: <b>${status}</b>.</p>
    ${trackingId ? `<p><b>Tracking ID:</b> ${trackingId}</p>` : ""}
    ${courierName ? `<p><b>Courier:</b> ${courierName}</p>` : ""}
    <p>Track your package on the courier website or via your Aashansh profile.</p>
  `;
  return wrapCustomerEmail(inner);
}
