// routes/authRoutes.js
const express = require("express");
const { expensesCollection } = require("../config/database");
const dotenv = require("dotenv");
const { ObjectId } = require("mongodb");

dotenv.config();
const router = express.Router();

// expenses related api start here

router.post("/", async (req, res) => {
  const { type, amount } = req.body;
  // console.log(body);
  const date = moment().tz("Asia/Dhaka").format("YYYY-MM-DD"); //.format("YYYY-MM-DD HH:mm A"); with time
  console.log(date);
  const expens = { type, amount, date };
  const result = await expensesCollection.insertOne(expens);
  res.send(result);
});

//  API for fetch data by month
router.get("/month", async (req, res) => {
  try {
    const { month } = req.query; // e.g., 1 for January, 2 for February
    const year = moment().tz("Asia/Dhaka").year(); // Current year in BD time
    // console.log(year);
    // console.log(month);
    if (!month) {
      return res.status(400).json({ message: "Month parameter is required" });
    }
    // Start and end of the month in Bangladesh timezone
    const startDate = moment
      .tz({ year, month: month - 1, day: 1 }, "Asia/Dhaka")
      .startOf("month")
      .toDate();
    const endDate = moment
      .tz({ year, month: month - 1, day: 1 }, "Asia/Dhaka")
      .endOf("month")
      .toDate();
    // console.log(startDate);
    // console.log(endDate);

    // Retrieve data for the given month
    const expenses = await expensesCollection
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 });
    // console.log(expenses);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await expensesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await expensesCollection.findOne(query);
  res.send(result);
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const body = req.body;
    const updatedExpens = {
      $set: body,
    };
    const result = await expensesCollection.updateOne(
      filter,
      updatedExpens,
      options
    );
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await expensesCollection.deleteOne(query);
  res.send(result);
});

// expenses related api end here

module.exports = router;
