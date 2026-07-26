import userModel from "../models/user.models.js";
import StockModel from "../models/stock.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import loggerModel from "../models/logger.model.js";
import { normalizeLoginInput } from "../utils/auth.utils.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

async function registerUser(req, res) {
  try {
    const { name, email, password, salary, role = "staff" } = req.body;

    if (!name || !email || !password || !salary) {
      return res.render("staff_add", {
        error: "Please fill in all required fields.",
      });
    }

    const isUserExists = await userModel.findOne({ email });

    if (isUserExists) {
      return res.render("staff_add", {
        error: "Email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      salary,
      role,
    });

    const accessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    const refreshToken = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect("/staff-table");
  } catch (error) {
    console.error("Register Error:", error);

    return res.render("staff_add", {
      error: "Something went wrong. Please try again.",
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const normalized = normalizeLoginInput(email, password);

    if (!normalized.valid) {
      return res.render("login", {
        error: normalized.error,
      });
    }

    const user = await userModel.findOne({ email: normalized.email });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(normalized.password, user.password);

    if (!isPasswordValid) {
      return res.render("login", {
        error: "Invalid email or password.",
      });
    }

    const accessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    const refreshToken = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    await loggerModel.create({
      user: user._id,
      ip,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Login Error:", error);

    return res.render("login", {
      error: "Unable to sign in right now. Please try again.",
    });
  }
}
async function logout(req, res) {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.redirect("/");
  } catch (error) {
    console.error(error);

    return res.status(500).render("login", {
      error: "Unable to logout. Please try again.",
    });
  }
}

async function welcomeMessage(req, res) {
  try {
    const userId = req.user?._id;
    const user = await userModel.findById(userId);

    const allStocks = await StockModel.find();
    const totalMedicines = allStocks.length;
    const lowStockCount = allStocks.filter(
      (stock) => Number(stock.quantity) <= 10,
    ).length;

    const totalStaff = await userModel.countDocuments({
      role: { $ne: "admin" },
    });
    const totalUsers = await userModel.countDocuments();
    const recentStaff = await userModel.find().sort({ createdAt: -1 }).limit(5);
    const stockSummary = await StockModel.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.render("dashboard", {
      user,
      totalMedicines,
      lowStockCount,
      totalStaff,
      totalUsers,
      recentStaff,
      stockSummary,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.render("login", {
      error: "Internal Server Error",
    });
  }
}

export { registerUser, loginUser, welcomeMessage, logout };
