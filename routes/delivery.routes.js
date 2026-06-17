import express from "express";
import { checkDelivery } from "../controllers/delivery.controller.js";

const router = express.Router();

router.get("/check", checkDelivery);

export default router;
