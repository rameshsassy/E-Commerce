import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  type: {
    type: String,
    enum: ['Refund', 'Replacement'],
    required: true
  },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Pickup Scheduled', 'Quality Check', 'Completed', 'Rejected'],
    default: 'Requested'
  },
  refundAmount: { type: Number },
  refundStatus: {
    type: String,
    enum: ['Pending', 'Processed', 'Failed', 'Not Applicable'],
    default: 'Pending'
  }
}, { timestamps: true });

export default mongoose.model('ReturnRequest', returnRequestSchema);
