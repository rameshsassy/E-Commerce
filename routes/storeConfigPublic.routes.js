import express from "express";
import { getStoreConfigPublic } from "../controllers/storeConfig.controller.js";

const router = express.Router();

router.get("/:sellerHandle", getStoreConfigPublic);

export default router;
