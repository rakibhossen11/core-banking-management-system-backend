// routes/authRoutes.js
const express = require("express");
const { customersCollection } = require("../config/database");
const dotenv = require("dotenv");
const { ObjectId } = require("mongodb");
const moment = require("moment-timezone"); // Import moment-timezone

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const form = req.body;
    console.log(form);
    const lastCustomer = await customersCollection
      .find()
      .sort({ customerId: -1 })
      .limit(1)
      .toArray();
    console.log(lastCustomer);
    const lastCustomerId =
      lastCustomer.length > 0
        ? parseInt(lastCustomer[0].customerId, 10)
        : 10000;
    console.log(lastCustomer);
    const newCustomerId = lastCustomerId + 1;
    console.log("new", newCustomerId);

    const customer = {
      ...req.body,
      customerId: newCustomerId,
      createdBy: "Rakib Hossen",
      createdAtDate: moment().tz("Asia/Dhaka").format("YYYY-MM-DD"),
      createdAtTime: moment().tz("Asia/Dhaka").format("HH:mm A"),
    };

    console.log(customer);

    const result = await customersCollection.insertOne(customer);
    res.status(201).json({ message: "Customer added successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/login", async (req, res) => {
  const user = req.body;
  console.log(user);
  // find user
  const query = { email: user.email };
  const existingUser = await usersCollection.findOne(query);
  console.log(existingUser);
  if (!existingUser) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  // compare password
  const validPassword = bcrypt.compare(user.password, existingUser.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ message: "Login successful" });
});

// router.get("/", async (req, res) => {
//   const result = await customersCollection.find().toArray();
//   res.send(result);
// });

// routes/customerRoutes.js
// router.get("/", async (req, res) => {
//   try {
//     // const { page = 1, limit = 10, search = "" } = req.query;
//     const { page = 1, limit = 10, } = req.query;
//     console.log(page,limit,search);
//     const skip = (page - 1) * limit;

//     // Build search query
//     const query = search ? {
//       $or: [
//         { name: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { phone: { $regex: search, $options: "i" } }
//       ]
//     } : {};
//     console.log(query);

//     // Get paginated results
//     const customers = await customersCollection
//       .find(query)
//       .skip(skip)
//       .limit(parseInt(limit))
//       .toArray();
//       console.log(customers);

//     // Get total count
//     const total = await customersCollection.countDocuments(query);
//     console.log(total);

//     res.json({
//       customers,
//       totalPages: Math.ceil(total / limit),
//       currentPage: parseInt(page),
//       totalCustomers: total
//     });

//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// routes/customerRoutes.js
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      customersCollection.find({})
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      customersCollection.countDocuments({})
    ]);

    res.status(200).json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalCustomers: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await customersCollection.findOne(query);
  res.send(result);
});

// Search customers by name
router.get("/search/:name", async (req, res) => {
  try {
    const { name } = req.params; // Get the search query from the URL
    // console.log(name);
    const customers = await customersCollection
      .find({
        name: { $regex: name, $options: "i" }, // Case-insensitive search
      })
      .toArray(); // Convert MongoDB cursor to an array
    // console.log(customers);
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// user transaction api
router.post("/transaction", async (req, res) => {
  try {
    const { transaction } = req.body;
    console.log(transaction);
    const { customerId, amount, type, description } = transaction;
    console.log(customerId, amount, type, description);

    // Validate transaction type
    if (!["withdraw", "deposit"].includes(type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    // Check if the customer exists
    const customer = await customersCollection.findOne({ customerId });
    console.log(customer);

    if (!customer) {
      return res.status(400).json({ error: "Customer not found!" });
    }

    // Initialize balance to 0 if it doesn't exist
    if (
      customer.balance === null ||
      customer.balance === NaN ||
      customer.balance === undefined
    ) {
      customer.balance = 0;
    }

    // Convert to Bangladeshi time
    const bdTime = moment().tz("Asia/Dhaka").format("DD-MM-YYYY hh:mm A");
    console.log(bdTime);

    // Calculate the new balance based on the transaction type
    let newBalance;
    if (type === "deposit") {
      newBalance = parseFloat(customer.balance) + parseFloat(amount);
    } else if (type === "withdraw") {
      newBalance = parseFloat(customer.balance) - parseFloat(amount);
    }

    // Update the customer document
    const updateCustomer = {
      $set: { balance: newBalance },
      $push: {
        transactions: {
          amount,
          type,
          date: bdTime,
          description,
          currentBalance: newBalance, // Add currentBalance field to the transaction
        },
      },
      // $push: { transactions: { amount, type, date: bdTime, description } },
    };

    console.log(updateCustomer);

    // Update the customer in the collection
    await customersCollection.updateOne({ customerId }, updateCustomer);

    // Send success response
    res
      .status(200)
      .json({ message: "Transaction successful!", updateCustomer });
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a product
router.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await usersCollection.deleteOne(query);
  res.send(result);
});

module.exports = router;
