// routes/authRoutes.js
const express = require("express");
const { usersCollection } = require("../config/database");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

// Email Verification Route
router.get("/", async (req, res) => {
  try {
    const result = await usersCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
