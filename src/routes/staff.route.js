import express from "express";
import {
  registerUser,
  loginUser,
  logout,
  welcomeMessage,
} from "../controllers/auth.controller.js";
import {
  allStaff,
  staffProfile,
  deleteStaff,
  resetPassword,
  profile,
  staffLoginDetails,
} from "../controllers/staff.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/permission.middleware.js";
const router = express.Router();

// Add Staff Page
router.get("/add-staff", isLoggedIn, isAdmin, (req, res) => {
  res.render("staff_add", {
    error: null,
  });
});
// staff profile
router.get("/staff/:_id", isLoggedIn, isAdmin, staffProfile);
//delete staff
router.get("/staff/delete/:_id", isLoggedIn, isAdmin, deleteStaff);

router.post("/api/v1/register", isLoggedIn, isAdmin, registerUser);

// staff view
router.get("/staff-table", isLoggedIn, isAdmin, allStaff, (req, res) => {
  res.render("all_staff", {
    error: null,
  });
});

router.get('/settings',isLoggedIn,profile)
router.get('/staffs/login-details', isLoggedIn, isAdmin, staffLoginDetails);
export default router;
