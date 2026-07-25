import express from "express";
import {
  registerUser,
  loginUser,
  logout
} from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();
// Login
router.get("/", (req, res) => {
  res.render("login", {
    error: null,
  });
});
router.post("/login", loginUser);
//logout
router.get('/logout',isLoggedIn,logout)

//health check
router.get("/health",(req,res)=>{
    return res.status(200).json({
        message:"All is Ok "
    })
})
export default router;