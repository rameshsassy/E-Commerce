import Shipment from "../models/Shipment.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendThankYouAfterDeliveryEmail } from "../services/email.service.js";

/** ~24h after delivery, send one thank-you per order */
export async function runThankYouAfterDelivery() {
  const lower = new Date(Date.now() - 36 * 3600000);
  const upper = new Date(Date.now() - 22 * 3600000);

  const shipments = await Shipment.find({
    status: "Delivered",
    actualDeliveryDate: { $exists: true, $lte: upper, $gte: lower },
  })
    .populate({ path: "order", select: "user thankYouEmailSent items totalAmount" })
    .limit(80);

  for (const s of shipments) {
    const order = s.order;
    if (!order || order.thankYouEmailSent) continue;

    const user = await User.findById(order.user).select("firstName email");
    if (!user?.email) continue;

    await sendThankYouAfterDeliveryEmail(user, order).catch(() => {});
    await Order.updateOne({ _id: order._id }, { $set: { thankYouEmailSent: true } });
  }
}
