import express from "express";
import { getPublicStore } from "../controllers/store.controller.js";

const router = express.Router();

router.get("/stores/:subdomain", getPublicStore);

export default router;
