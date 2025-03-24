// routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { usersCollection, transporter } = require("../config/database");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(name, email, password);
    let user = await usersCollection.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = { name, email, password: hashedPassword, verified: false };
    console.log(user);
    await usersCollection.insertOne(user);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log(token);
    const verificationLink = `http://localhost:5000/auth/verify/${token}`;
    console.log(verificationLink);
    // Send the verification email
    try {
      await transporter.sendMail(
        // {
        //   from: process.env.EMAIL, // sender address
        //   to: email, // list of receivers
        //   subject: "Hello ✔", // Subject line
        //   text: "Hello world?", // plain text body
        //   html: "<b>Hello world?</b>", // html body
        // }
        {
          from: process.env.EMAIL,
          to: email,
          subject: "Verify Your Email",
          html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
        }
      );
      console.log("Verification email sent successfully");
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
    // await transporter.sendMail({
    //   from: process.env.EMAIL,
    //   to: email,
    //   subject: "Verify Your Email",
    //   html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`
    // });
    console.log(transporter);
    res
      .status(201)
      .json({ message: "User registered. Check email for verification link." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Email Verification Route
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    console.log(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await usersCollection.updateOne(
      { email: decoded.email },
      { $set: { verified: true } }
    );
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
