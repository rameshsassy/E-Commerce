import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  maxDiscountAmount: { type: Number },
  minOrderAmount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: null }, // Null means unlimited
  usedCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
