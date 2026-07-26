import userModel from "../models/user.models.js";
import loggerModel from "../models/logger.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function allStaff(req, res) {
  try {
    const staffs = await userModel.find();
    return res.render("all_staff", {
      staffs,
    });
  } catch (error) {
    return res.render("login", {
      error: "Internal Server Error",
    });
  }
}

async function staffProfile(req, res) {
  try {
    const _id = req.params._id;

    const staff = await userModel.findById(_id);
    return res.render("staff_profile", {
      staff,
    });
  } catch (error) {
    return res.render("all_staff", {
      error: "Something Went Wrong",
    });
  }
}

async function deleteStaff(req, res) {
  try {
    const _id = req.params._id;
    await userModel.findByIdAndDelete(_id);
    return res.redirect("/staff-table");
  } catch (error) {
    return res.render("all_staff", {
      error: "Something Went Wrong TO Delete Staff Please Try After Sometime.",
    });
  }
}

async function profile(req, res) {
  try {
    const _id = req.user;
    const profile = await userModel.findById(_id);
    return res.render("settings", {
      profile,
    });
  } catch (error) {
    console.log(error);
  }
}

async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    const _id = req.user;
    const user = await userModel.findById(_id);

    console.log(user);
    
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function staffLoginDetails(req, res) {
  try {
    const loginLogs = await loggerModel
      .find()
      .populate("user", "name email role")
      .sort({ logged_at: -1 });

    return res.render("staff_analysis", {
      loginLogs,
      error: null,
    });
  } catch (error) {
    console.error("Staff login details error:", error);
    return res.render("staff_analysis", {
      loginLogs: [],
      error: "Unable to load login details.",
    });
  }
}

export { allStaff, staffProfile, deleteStaff, resetPassword, profile, staffLoginDetails };
