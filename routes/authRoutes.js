// routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { usersCollection,transporter } = require("../config/database");
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await usersCollection.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = { name, email, password: hashedPassword, verified: false };
    await usersCollection.insertOne(user);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const verificationLink = `http://localhost:5173/verify/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`
    });
    res.status(201).json({ message: "User registered. Check email for verification link." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Email Verification Route
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await usersCollection.updateOne({ email: decoded.email }, { $set: { verified: true } });
    res.status(200).json({ message: "Email verified. You can now log in." });
  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    // res.send("users");
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;