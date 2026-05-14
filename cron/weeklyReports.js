import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendWeeklySellerReport } from "../services/email.service.js";

export async function runWeeklySellerReports() {
  const sellers = await User.find({ role: "seller", status: "approved" })
    .select("firstName email")
    .limit(300);
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  for (const seller of sellers) {
    const orders = await Order.find({
      paymentStatus: "completed",
      createdAt: { $gte: weekAgo },
      "items.seller": seller._id,
    }).select("items");

    let revenue = 0;
    const orderIds = new Set();
    for (const o of orders) {
      let touched = false;
      for (const it of o.items || []) {
        if (it.seller?.toString() === seller._id.toString()) {
          revenue += (it.price || 0) * (it.quantity || 0);
          touched = true;
        }
      }
      if (touched) orderIds.add(o._id.toString());
    }
    const ordersCount = orderIds.size;

    const productsCount = await Product.countDocuments({ sellerId: seller._id, isActive: true });
    await sendWeeklySellerReport(seller, {
      ordersCount,
      revenue,
      productsCount,
    }).catch(() => {});
  }
}
