import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createConversation,
  listConversations,
  getMessages,
  sendMessage,
  assignConversation,
  listSellers
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/conversations", protect, createConversation);
router.get("/conversations", protect, listConversations);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.post("/conversations/:conversationId/messages", protect, sendMessage);
router.post("/conversations/:conversationId/assign", protect, assignConversation);
router.get("/sellers", protect, listSellers);

export default router;
