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
      if (currentUser.role !== "customer") {
        return res.status(403).json({ message: "Only customers can start customer-admin chats" });
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
      if (currentUser.role !== "seller") {
        return res.status(403).json({ message: "Only sellers can start seller-admin chats" });
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
