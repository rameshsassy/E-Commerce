import Product from "../models/Product.js";

const PINCODE_DB = {
  "110001": { city: "New Delhi", days: 3 },
  "400001": { city: "Mumbai", days: 4 },
  "560001": { city: "Bengaluru", days: 5 },
  "700001": { city: "Kolkata", days: 4 },
  "302001": { city: "Jaipur", days: 2 },
};

export const checkDelivery = async (req, res) => {
  try {
    const { pincode, productId } = req.query;

    if (!pincode || !productId) {
      return res.status(400).json({ message: "Pincode and Product ID are required." });
    }

    const product = await Product.findById(productId).populate({
      path: "sellerId",
      select: "isHyperlocal deliverablePincodes",
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const seller = product.sellerId;
    let isDeliverable = true;

    if (seller && seller.isHyperlocal) {
      isDeliverable = seller.deliverablePincodes.includes(pincode.trim());
    }

    if (product.deliveryBy === "pincode" && product.deliveryValues?.length > 0) {
      isDeliverable = product.deliveryValues.includes(pincode.trim());
    } else if (product.deliveryBy === "all_india") {
      isDeliverable = true;
    }

    if (!isDeliverable) {
      return res.json({
        available: false,
        message: `Currently not delivering to ${pincode}.`,
      });
    }

    // Calculate delivery days
    const pinDetails = PINCODE_DB[pincode.trim()];
    const extraDays = pinDetails ? pinDetails.days : 5;
    const dispatchDays = product.dispatchDeliveryDays || 2;
    const totalDays = dispatchDays + extraDays;

    const deliveryDate = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
    const dateString = deliveryDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return res.json({
      available: true,
      estimatedDeliveryDate: dateString,
      message: `Delivery available to ${pinDetails ? pinDetails.city : "your area"} by ${dateString}.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
