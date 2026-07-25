import express from "express";
import { isLoggedIn} from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/permission.middleware.js";
import {welcomeMessage } from '../controllers/auth.controller.js'
const router = express.Router();


// Dashboard
router.get("/dashboard",isLoggedIn, welcomeMessage,(req, res) => {
  res.render("dashboard", {
    error: null,
  });
});

export default router;