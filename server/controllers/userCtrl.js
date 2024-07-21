const Users = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { SECRET_KEY, REFRESH_TOKEN_SECRET } = process.env;

const userCtrl = {
  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Check if email is already registered
      const existingUser = await Users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: "Email Already Registered" });
      }

      // Validate password length
      if (password.length < 6) {
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 characters" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new Users({
        name,
        email,
        password: hashedPassword,
        role,
      });
      await newUser.save();

      // Generate JWT token and refresh token
      const userId = newUser._id;
      const accessToken = generateAccessToken(userId, newUser.role);
      const refreshToken = generateRefreshToken(userId);

      // Set refresh token cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true, // set to true in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/user/refresh_token",
      });

      res.status(201).json({
        msg: "User Registered Successfully",
        accessToken: accessToken, // <--- use the awaited value
        refreshToken: refreshToken, // <--- use the awaited value
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if email exists
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Email not found" });
      }

      // Check if password is correct
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ msg: "Invalid password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ msg: "User is not active" });
      }

      // Generate JWT token and refresh token
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      res
        .status(200)
        .json({ msg: "Login Successful", accessToken, refreshToken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshToken;
      if (!rf_token) {
        return res.status(401).json({ msg: "Please Login or Register" });
      }

      // Verify the refresh token
      const userId = jwt.verify(rf_token, REFRESH_TOKEN_SECRET);
      if (!userId) {
        return res.status(401).json({ msg: "Please Login or Register" });
      }

      // Check if user exists
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(401).json({ msg: "User not found" });
      }

      // Generate a new access token and refresh token
      const accessToken = generateAccessToken(userId, Users.role);
      const newRefreshToken = generateRefreshToken(userId);

      // Set the new refresh token cookie
      res.cookie("rf_token", newRefreshToken, {
        httpOnly: true,
        secure: true, // set to true in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/user/refresh_token",
      });

      res.status(200).json({ msg: "Refresh token updated", accessToken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, SECRET_KEY, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = userCtrl;
