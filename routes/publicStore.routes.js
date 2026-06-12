import express from "express";
import { getPublicStore } from "../controllers/store.controller.js";
import { subscribeToNewsletter } from "../controllers/newsletter.controller.js";

const router = express.Router();

router.get("/store/current", getPublicStore);
router.get("/stores/:subdomain", getPublicStore);
router.post("/newsletter/subscribe", subscribeToNewsletter);

export default router;
