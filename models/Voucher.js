import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scope: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  category: {
    type: String,
    default: null
  },
  voucherCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percent', 'flat'],
    default: 'percent'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrder: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number,
    default: null // null/0 means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiry: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Voucher', voucherSchema);
