require("dotenv").config();
const express = require("express");
const { connectDB } = require("./config/database");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const users = require("./routes/userRoutes");
const products = require("./routes/productRoutes");
const orders = require("./routes/orderRoutes");
const customers = require("./routes/customerRoutes");
const expenses = require("./routes/expensesRoutes");
const transaction = require("./routes/transactionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRoutes);
app.use("/users",users);
app.use("/customers",customers);
app.use("/products",products);
app.use("/orders",orders);
app.use("/expenses",expenses);
app.use("/trxn",transaction);

// Search customers by name
app.get("/customers/search", async (req, res) => {
  try {
    const { name } = req.query; // Get the search query from the URL
    console.log(name);
    // const customers = await customersCollection.find({
    //   name: { $regex: name, $options: "i" }, // Case-insensitive search
    // });
    // res.status(200).json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/",async (req, res) => {
    res.send("core banking server is running");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
