import express from 'express';
import { createTicket, getMyTickets } from '../controllers/support.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', protect, ...upload.array('attachments', 3), createTicket);
router.get('/', protect, getMyTickets);

export default router;
