import express from "express";
import {
  registerUser,
  loginUser,
  logout,
  welcomeMessage,
  allStaff
} from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
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
// Add Staff Page
router.get("/add-staff",isLoggedIn,isAdmin, (req, res) => {
  res.render("staff_add", {
    error: null,
  });
});
router.get("/health",(req,res)=>{
    return res.status(200).json({
        message:"All is Ok "
    })
})
router.post("/api/v1/register",isLoggedIn,isAdmin, registerUser);



// Dashboard
router.get("/dashboard",isLoggedIn, welcomeMessage,(req, res) => {
  res.render("dashboard", {
    error: null,
  });
});
// staff view
router.get('/staff-table',isLoggedIn,isAdmin,allStaff,(req,res)=>{
    res.render('all_staff',{
        error:null
    })
})
export default router;