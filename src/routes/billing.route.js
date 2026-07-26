import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { showBillingPage, generateBill, AllCustomer, chatbotMessage } from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/billing", isLoggedIn, showBillingPage);
router.post("/billing/generate", isLoggedIn, generateBill);
router.post("/chatbot/message", isLoggedIn, chatbotMessage);
router.get('/customer', isLoggedIn, AllCustomer);
export default router;
