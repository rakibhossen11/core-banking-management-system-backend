// routes/authRoutes.js
const express = require("express");
const { customersCollection } = require("../config/database");
const dotenv = require("dotenv");
const { ObjectId } = require("mongodb");

dotenv.config();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // const { sort = "asc" } = req.body;
    // console.log(sort);
    // const sortCustomer = sort == "asc" ? 1 : -1;
    const customerBalance = await customersCollection
      .find({})
      .sort({ balance: -1 }) 
      .toArray();
    console.log(customerBalance);
    res.send(customerBalance);
  } catch (error) {}
});

module.exports = router;

// Find customers with positive balance and sort descending
// const positiveBalances = await customersCollection
// .find({ balance: { $gte: 0 } }) // Greater than or equal to 0
// .sort({ balance: -1 }) // High to low
// .toArray();

// // Find customers with negative balance and sort ascending
// const negativeBalances = await customersCollection
// .find({ balance: { $lt: 0 } }) // Less than 0
// .sort({ balance: 1 }) // Low to high
// .toArray();

// res.json({
// positiveBalances,
// negativeBalances
// });
