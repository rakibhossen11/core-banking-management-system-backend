// routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { productsCollection, ordersCollection } = require("../config/database");
const { ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { orderData } = req.body;

    // Loop through each product in the order
    for (const order of orderData.products) {
      // console.log(order);
      const product = await productsCollection.findOne({
        productId: order.id, // Fix: Use productId instead of id
      });
      // console.log(product);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${order.id} not found` });
      }

      if (product.stockQuantity < order.quantity) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}` });
      }

      const date = moment().tz("Asia/Dhaka").format("YYYY-MM-DD"); //.format("YYYY-MM-DD HH:mm A"); with time

      // Decrease stock and update sell history
      await productsCollection.updateOne(
        { productId: product.productId },
        {
          $inc: { stockQuantity: -order.quantity }, // Reduce stock
          $push: {
            sellHistory: {
              quantity: order.quantity,
              price: product.sellprice,
              date: date,
            },
          }, // Add sell history
        }
      );
    }

    const date = moment().tz("Asia/Dhaka").format("YYYY-MM-DD"); //.format("YYYY-MM-DD HH:mm A"); with time
    // Create the order object with date and time
    const order = {
      ...orderData, // Include all order data
      date: date, // Add the order date and time
    };
    const result = await ordersCollection.insertOne(order);

    res.status(200).json({
      message: "Order processed successfully",
      orderId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/update-status", async (req, res) => {
  const { orderId, status } = req.body;
  // console.log(orderId, status);

  try {
    // Validate status
    // if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    //   return res.status(400).json({ message: 'Invalid status' });
    // }

    // Update the order status
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status } }
    );

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (err) {
    // console.error("Error updating order status:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

router.delete("/delete", async (req, res) => {
  const { orderIds } = req.body;
  // console.log(orderIds);

  try {
    // Convert orderIds (strings) to MongoDB ObjectId
    // const objectIds = orderIds.map((id) => new ObjectId(id));

    // Delete orders from MongoDB
    await ordersCollection.deleteMany({ _id: { $in: orderIds } });

    res.status(200).json({ message: "Orders deleted successfully" });
  } catch (err) {
    console.error("Error deleting orders:", err);
    res.status(500).json({ message: "Failed to delete orders" });
  }
});

router.get("/", async (req, res) => {
  const { status } = req.query;
  // console.log(status); // Debugging: Log the status query parameter

  try {
    let query = {};
    if (status) {
      query = { status: status }; // Add status to the query if it exists
    }

    const result = await ordersCollection.find(query).toArray(); // Filter orders based on the query
    // console.log(result);
    res.send(result);
  } catch (error) {
    console.error("Error fetching orders:", error); // Log the error for debugging
    res
      .status(500)
      .send({ message: "Internal Server Error", error: error.message });
  }
});
// order related api end from here

module.exports = router;
