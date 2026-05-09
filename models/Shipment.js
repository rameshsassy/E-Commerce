import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  trackingId: { type: String },
  courierName: { type: String },
  estimatedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Shipment', shipmentSchema);
