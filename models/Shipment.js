import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  /** Display id: PREFIX + sequence + DDMMYYYY — e.g. FAT0128052026 */
  displayOrderId: { type: String, trim: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    variantLabel: { type: String, trim: true, default: '' },
  }],
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  sellerOrderStatus: {
    type: String,
    enum: [
      'Accept Order',
      'Reject Order',
      'Order Dispatched',
      'Order Shipped',
      'Order in Transit',
      'Product Delivered',
    ],
    default: null,
  },
  statusTimeline: {
    orderPlaced: { type: Date },
    orderAccepted: { type: Date },
    orderDispatched: { type: Date },
    orderShipped: { type: Date },
    orderInTransit: { type: Date },
    orderDelivered: { type: Date },
    estimatedDelivery: { type: Date },
  },
  trackingId: { type: String },
  courierName: { type: String },
  estimatedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Shipment', shipmentSchema);
