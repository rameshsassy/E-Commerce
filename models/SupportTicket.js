import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  subject: {
    type: String,
    required: true,
  },
  issueType: {
    type: String,
    enum: ['Order Issue', 'Payment Issue', 'Return/Refund', 'Account Issue', 'Other'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [{
    type: String, // URLs/paths to uploaded files
  }],
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  adminNotes: {
    type: String,
  }
}, {
  timestamps: true,
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
