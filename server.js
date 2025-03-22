require("dotenv").config();
const express = require("express");
const { connectDB } = require("./config/database");
const cors = require("cors");
// const authRoutes = require("./routes/authRoutes");
const users = require("./routes/userRoutes");
const products = require("./routes/productRoutes");
const orders = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
// app.use("/auth", authRoutes);
app.use("/users",users);
app.use("/products",products);
app.use("/orders",orders);

app.get("/",async (req, res) => {
    res.send("core banking server is running");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
