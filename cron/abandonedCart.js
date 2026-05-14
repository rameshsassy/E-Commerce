import Cart from "../models/Cart.js";
import EmailLog from "../models/EmailLog.js";
import { sendCartAbandonmentReminder } from "../services/email.service.js";

export async function runAbandonedCartReminders() {
  const minIdle = new Date(Date.now() - 2 * 3600000);
  const maxIdle = new Date(Date.now() - 10 * 3600000);

  const carts = await Cart.find({
    "items.0": { $exists: true },
    updatedAt: { $lte: minIdle, $gte: maxIdle },
  })
    .populate("user")
    .populate({ path: "items.product", select: "title" })
    .limit(40);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  for (const cart of carts) {
    const u = cart.user;
    if (!u || u.role !== "customer" || !u.email) continue;

    const already = await EmailLog.findOne({
      templateType: "customer_cart_reminder",
      to: u.email,
      createdAt: { $gte: startOfDay },
    });
    if (already) continue;

    const preview = (cart.items || [])
      .slice(0, 4)
      .map((i) => i.product?.title || "Product")
      .join(", ");

    await sendCartAbandonmentReminder(u, preview).catch(() => {});
  }
}
