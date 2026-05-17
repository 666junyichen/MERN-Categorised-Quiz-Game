import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sanitize } from "../utils/sanitize.js";

export const register = async (req, res) => {
  try {
    const username = sanitize(req.body.username);
    const password = req.body.password;
    const role = sanitize(req.body.role);
    const adminSecret = req.body.adminSecret;
    const normalizedRole = role || "user";

    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 3 characters"
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    if (!["user", "admin"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role"
      });
    }

    if (normalizedRole === "admin") {
      const registerSecret = process.env.ADMIN_REGISTER_SECRET;

      if (!registerSecret) {
        return res.status(500).json({
          success: false,
          error: "Admin registration is not configured"
        });
      }

      if (adminSecret !== registerSecret) {
        return res.status(403).json({
          success: false,
          error: "Invalid admin secret"
        });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed,
      role: normalizedRole
    });

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "Username already exists. Please choose a different username."
      });
    }
    res.status(500).json({
      success: false,
      error: "Register failed"
    });
  }
};

export const login = async (req, res) => {
  try {
    const username = sanitize(req.body.username);
    const password = req.body.password;
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: "JWT is not configured"
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // 校验密码
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // 生成 JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // 数据返回
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
};