import mongoose from "mongoose";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// ===============================
// 💬 CREATE CONVERSATION
// ===============================
export const createConversation = async (req, res) => {
  try {
    const { type, sellerId } = req.body;
    const currentUser = req.user;

    if (!type) {
      return res.status(400).json({ message: "Conversation type is required" });
    }

    const allowedTypes = ["customer_seller", "customer_admin", "customer_both", "seller_admin"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid conversation type" });
    }

    // Find primary admin
    const primaryAdmin = await User.findOne({ role: "admin" });
    const adminId = primaryAdmin ? primaryAdmin._id : null;

    let participantIds = [currentUser._id];

    if (type === "customer_seller") {
      if (currentUser.role !== "customer") {
        return res.status(403).json({ message: "Only customers can start customer-seller chats" });
      }
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required for customer_seller chats" });
      }
      const seller = await User.findOne({ _id: sellerId, role: "seller" });
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      participantIds.push(seller._id);
    } else if (type === "customer_admin") {
      if (currentUser.role !== "customer" && currentUser.role !== "admin" && currentUser.role !== "admin_staff") {
        return res.status(403).json({ message: "Only customers and admins can start customer-admin chats" });
      }
      if (!adminId) {
        return res.status(503).json({ message: "Admin system is offline. Try again later." });
      }
      participantIds.push(adminId);
    } else if (type === "customer_both") {
      if (currentUser.role !== "customer") {
        return res.status(403).json({ message: "Only customers can start group chats" });
      }
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required for group chats" });
      }
      const seller = await User.findOne({ _id: sellerId, role: "seller" });
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      if (!adminId) {
        return res.status(503).json({ message: "Admin system is offline. Try again later." });
      }
      participantIds.push(seller._id);
      participantIds.push(adminId);
    } else if (type === "seller_admin") {
      if (currentUser.role !== "seller" && currentUser.role !== "admin" && currentUser.role !== "admin_staff") {
        return res.status(403).json({ message: "Only sellers and admins can start seller-admin chats" });
      }
      if (!adminId) {
        return res.status(503).json({ message: "Admin system is offline. Try again later." });
      }
      participantIds.push(adminId);
    }

    // Convert all ids to string for comparison, sort them, and convert back to ObjectId to avoid duplicate checks
    const uniqueParticipants = Array.from(new Set(participantIds.map(id => id.toString())))
      .map(id => new mongoose.Types.ObjectId(id));

    // Check if conversation already exists with exact same type and participants
    let existingConvo = await Conversation.findOne({
      type,
      participants: { $all: uniqueParticipants, $size: uniqueParticipants.length }
    }).populate("participants", "firstName lastName email role businessName organizationLogo");

    if (existingConvo) {
      return res.status(200).json({
        message: "Conversation already exists",
        conversation: existingConvo
      });
    }

    // Create new conversation
    const newConvo = new Conversation({
      type,
      participants: uniqueParticipants,
      lastMessage: "Conversation started",
      lastMessageAt: new Date()
    });

    await newConvo.save();

    const populatedConvo = await Conversation.findById(newConvo._id)
      .populate("participants", "firstName lastName email role businessName organizationLogo");

    res.status(201).json({
      message: "Conversation created successfully",
      conversation: populatedConvo
    });

  } catch (error) {
    console.error("[chat] createConversation:", error);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};

// ===============================
// 💬 LIST CONVERSATIONS
// ===============================
export const listConversations = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === "customer" || user.role === "seller") {
      query.participants = user._id;
    } else if (user.role === "admin_staff") {
      // Sub-admins see chats assigned to them
      query = {
        $or: [
          { assignedTo: user._id },
          { participants: user._id }
        ]
      };
    } else if (user.role === "admin") {
      // Primary admin sees all admin-related chats
      query = {
        type: { $in: ["customer_admin", "customer_both", "seller_admin"] }
      };
    } else {
      return res.status(403).json({ message: "Unauthorized role for listing chats" });
    }

    const conversations = await Conversation.find(query)
      .populate("participants", "firstName lastName email role businessName organizationLogo")
      .populate("assignedTo", "firstName lastName email adminAccessLevel")
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      message: "Conversations fetched successfully",
      conversations
    });
  } catch (error) {
    console.error("[chat] listConversations:", error);
    res.status(500).json({ message: "Failed to list conversations" });
  }
};

// ===============================
// 💬 GET MESSAGES
// ===============================
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user = req.user;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Access check:
    // User must be a participant, or assigned sub-admin, or primary admin
    const isParticipant = conversation.participants.some(p => p.toString() === user._id.toString());
    const isAssigned = conversation.assignedTo && conversation.assignedTo.toString() === user._id.toString();
    const isAdmin = user.role === "admin";

    if (!isParticipant && !isAssigned && !isAdmin) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName email role businessName")
      .sort({ createdAt: 1 });

    res.status(200).json({
      message: "Messages fetched successfully",
      messages
    });
  } catch (error) {
    console.error("[chat] getMessages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

const FAQS_LIST = [
  {
    keywords: ["track", "status", "where is my order", "tracking", "delivery status"],
    question: "How do I track my order?",
    answer: "Once your order is shipped, you will receive an email and a notification in your profile with the tracking ID. You can go to Profile > Orders and click 'Track Package' to see real-time updates."
  },
  {
    keywords: ["cancel", "modify", "change order", "change address"],
    question: "Can I modify or cancel my order?",
    answer: "You can cancel your order anytime before it changes to 'Packed' or 'Shipped' status. Once shipped, you cannot cancel it, but you can request a return after delivery."
  },
  {
    keywords: ["delay", "late", "not arrived", "haven't received", "where is my delivery", "delayed"],
    question: "What should I do if my order is delayed?",
    answer: "We aim to deliver all products within 3-5 business days. If your order is delayed, please check the tracking link. If there's no update for 48 hours, raise a support ticket and we will assist you."
  },
  {
    keywords: ["payment method", "accept", "how to pay", "pay", "cod", "credit card", "upi", "razorpay", "payment option"],
    question: "What payment methods do you accept?",
    answer: "We accept all major Credit/Debit Cards, UPI, Net Banking, and Wallets through our secure Razorpay integration. We also offer Cash on Delivery (COD) in select pincodes."
  },
  {
    keywords: ["failed", "deducted", "payment failed", "refund transaction", "money cut", "transaction failed"],
    question: "My payment failed but money was deducted. What do I do?",
    answer: "Don't worry! If money was deducted during a failed transaction, it is usually automatically refunded by your bank within 5-7 business days. If you still don't receive it, please contact our support."
  },
  {
    keywords: ["secure", "safety", "card details", "encryption", "safe"],
    question: "Are my payment details secure?",
    answer: "Yes, 100%. We do not store any card details on our servers. All transactions are securely processed through industry-leading payment gateways with end-to-end encryption."
  },
  {
    keywords: ["return policy", "how to return", "refund policy", "return process", "can i return"],
    question: "What is your return policy?",
    answer: "We offer a hassle-free 7-day return policy for most products. The item must be unused, in its original packaging, and with all tags intact."
  },
  {
    keywords: ["refund take", "how long refund", "refund status", "when will i get my refund"],
    question: "How long does a refund take?",
    answer: "Once your returned item is received and inspected by the seller, your refund will be processed to the original payment method within 3-5 business days."
  },
  {
    keywords: ["return shipping", "pay for return", "shipping cost return", "is return free"],
    question: "Do I have to pay for return shipping?",
    answer: "If the product is defective or incorrect, we will cover the return shipping costs. For all other reasons, a small convenience fee may be deducted from your refund."
  },
  {
    keywords: ["international", "ship outside", "abroad", "foreign", "other countries"],
    question: "Do you ship internationally?",
    answer: "Currently, we only ship within India. We are working on expanding our logistics to international markets soon!"
  },
  {
    keywords: ["shipping charge", "delivery charge", "free delivery", "free shipping", "shipping fee", "delivery cost"],
    question: "How much are the delivery charges?",
    answer: "Standard delivery is free on orders above Rs. 999. For orders below this amount, a flat shipping fee of Rs. 50 is applied at checkout."
  },
  {
    keywords: ["update profile", "change profile", "personal information", "update details", "change email", "change phone"],
    question: "How do I update my profile details?",
    answer: "Log in to your account, go to your Profile dashboard, and navigate to the 'Personal Information' tab to update your details."
  },
  {
    keywords: ["forgot password", "reset password", "change password", "recover account"],
    question: "I forgot my password. How can I reset it?",
    answer: "Click on the 'Forgot Password' link on the login page. Enter your registered email address, and we will send you a secure link to reset your password."
  }
];

const findFAQMatch = (messageText) => {
  const normalizedText = messageText.toLowerCase();
  for (const faq of FAQS_LIST) {
    for (const keyword of faq.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }
  return null;
};

// ===============================
// 💬 SEND MESSAGE
// ===============================
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const user = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Access check
    const isParticipant = conversation.participants.some(p => p.toString() === user._id.toString());
    const isAssigned = conversation.assignedTo && conversation.assignedTo.toString() === user._id.toString();
    const isAdmin = user.role === "admin";

    if (!isParticipant && !isAssigned && !isAdmin) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const newMessage = new Message({
      conversationId,
      sender: user._id,
      text: text.trim()
    });

    await newMessage.save();

    // Update conversation summary
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMsg = await Message.findById(newMessage._id)
      .populate("sender", "firstName lastName email role businessName");

    // Trigger FAQ auto-reply in background for customer_admin and seller_admin chats
    if (
      (conversation.type === "customer_admin" || conversation.type === "seller_admin") &&
      user.role !== "admin" &&
      user.role !== "admin_staff"
    ) {
      setTimeout(async () => {
        try {
          const primaryAdmin = await User.findOne({ role: "admin" });
          const botSenderId = primaryAdmin ? primaryAdmin._id : user._id;

          const match = findFAQMatch(text.trim());
          let replyText = "";

          if (match) {
            replyText = `Based on your question, here is what I found in our FAQ:\n\n**${match.question}**\n${match.answer}`;
          } else {
            // Check if we already notified the user recently to avoid spamming
            const lastMessages = await Message.find({ conversationId })
              .sort({ createdAt: -1 })
              .limit(5);

            const alreadyNotified = lastMessages.some(m =>
              m.sender.toString() === botSenderId.toString() &&
              m.text.includes("24 working hours")
            );

            if (!alreadyNotified) {
              replyText = "I couldn't find a direct answer to your question in our FAQs. A support representative will get back to you within 24 working hours.";
            }
          }

          if (replyText) {
            const botMessage = new Message({
              conversationId,
              sender: botSenderId,
              text: replyText
            });
            await botMessage.save();

            conversation.lastMessage = replyText;
            conversation.lastMessageAt = new Date();
            await conversation.save();
          }
        } catch (botErr) {
          console.error("[chat-bot] Auto-response failed:", botErr);
        }
      }, 800);
    }

    res.status(201).json({
      message: "Message sent successfully",
      messageData: populatedMsg
    });
  } catch (error) {
    console.error("[chat] sendMessage:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ===============================
// 💬 ASSIGN CONVERSATION
// ===============================
export const assignConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { staffId } = req.body;
    const user = req.user;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only primary admins can assign chats" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // If staffId is provided, verify it is a valid admin_staff user
    let staffUser = null;
    if (staffId) {
      staffUser = await User.findOne({ _id: staffId, role: "admin_staff" });
      if (!staffUser) {
        return res.status(404).json({ message: "Sub-admin staff member not found" });
      }
    }

    conversation.assignedTo = staffId ? staffUser._id : null;
    await conversation.save();

    const populatedConvo = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName email role businessName organizationLogo")
      .populate("assignedTo", "firstName lastName email adminAccessLevel");

    res.status(200).json({
      message: staffId ? `Chat assigned to ${staffUser.firstName}` : "Chat unassigned",
      conversation: populatedConvo
    });
  } catch (error) {
    console.error("[chat] assignConversation:", error);
    res.status(500).json({ message: "Failed to assign conversation" });
  }
};

// ===============================
// 💬 LIST APPROVED SELLERS
// ===============================
export const listSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller", status: "approved" })
      .select("_id firstName lastName businessName organizationLogo");
    res.status(200).json({
      message: "Sellers fetched successfully",
      sellers
    });
  } catch (error) {
    console.error("[chat] listSellers:", error);
    res.status(500).json({ message: "Failed to list sellers" });
  }
};
