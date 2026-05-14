import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendMonthlySellerInsights } from "../services/email.service.js";

export async function runMonthlySellerInsights() {
  const sellers = await User.find({ role: "seller", status: "approved" })
    .select("firstName email")
    .limit(300);
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  for (const seller of sellers) {
    const orders = await Order.find({
      paymentStatus: "completed",
      createdAt: { $gte: monthAgo },
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
    const note =
      ordersCount > 5
        ? "Strong month — consider promoting your top sellers."
        : "List new SKUs and seasonal bundles to boost discovery.";

    await sendMonthlySellerInsights(seller, {
      ordersCount,
      revenue,
      productsCount,
      note,
    }).catch(() => {});
  }
}
