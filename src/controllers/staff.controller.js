import userModel from "../models/user.models.js";
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
export { allStaff, staffProfile, deleteStaff };
