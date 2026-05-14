import SupportTicket from '../models/SupportTicket.js';

// @desc    Create a support ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const { subject, issueType, message, orderId } = req.body;

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => file.path);
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      order: orderId || null,
      subject,
      issueType,
      message,
      attachments
    });

    res.status(201).json({
      message: "Support ticket created successfully",
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's support tickets
// @route   GET /api/support
// @access  Private
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .populate('order', '_id totalAmount createdAt')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
