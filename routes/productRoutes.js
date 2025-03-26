// routes/authRoutes.js
const express = require("express");
const { productsCollection } = require("../config/database");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const lastProduct = await productsCollection
      .find()
      .sort({ productId: -1 })
      .limit(1)
      .toArray();
    // console.log(lastProduct);
    const lastProductId =
      lastProduct.length > 0 ? parseInt(lastProduct[0].productId, 10) : 10000;
    console.log(lastProduct);
    const newProductId = lastProductId + 1;
    // console.log(newProductId);

    const product = {
      ...req.body,
      productId: newProductId,
      createdAtDate: moment().tz("Asia/Dhaka").format("YYYY-MM-DD"),
      createdAtTime: moment().tz("Asia/Dhaka").format("HH:mm A"),
    };

    // console.log(product);

    const result = await productsCollection.insertOne(product);
    res.status(201).json({ message: "Product added successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// http://localhost:5000/products/by-date?date=2025-03-01 this link use for get product by date
router.get("/by-date", async (req, res) => {
  try {
    const { date } = req.query; // Expect date in format YYYY-MM-DD
    // console.log(date);
    const products = await productsCollection
      .find({ createdAtDate: { $regex: `^${date}` } })
      .toArray();
    // console.log(products);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// product details api
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);

    // Check if the ID is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Create a query with ObjectId
    const query = { _id: new ObjectId(id) };

    // Find the product
    const result = await productsCollection.findOne(query);

    // If product not found, return 404
    if (!result) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Return the product
    res.json(result);
  } catch (err) {
    // Handle server errors
    res.status(500).json({ message: err.message });
  }
});

// buy product increase quantity
router.post("/buy", async (req, res) => {
  try {
    const { uniqId, quantity } = req.body;
    // console.log(uniqId, quantity);
    const product = await productsCollection.findOne({ uniqId });
    // console.log("Before", product.stockQuantity);
    // console.log("middle", product.stockQuantity + 10);
    // console.log("After", parseInt(product.stockQuantity) + 30);

    if (!product) {
    } else {
      // Get current time in Bangladeshi local time (BST)
      const bdDate = moment().tz("Asia/Dhaka").format("YYYY-MM-DD"); //.format("YYYY-MM-DD HH:mm A"); with time
      const updateProduct = {
        $set: { stockQuantity: product.stockQuantity + quantity },
        $push: { buyHistory: { quantity, date: bdDate } },
      };

      // console.log(updateProduct);

      // update the product in the collection
      await productsCollection.updateOne({ uniqId }, updateProduct);
      product.stockQuantity += quantity; // Update the local product object for the response
      product.buyHistory.push({ quantity, date: new Date() }); // Update the local product object for the response
    }
    res.status(200).json({ message: "Buy successful!", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Sell product reduce quantity
router.post("/sell", async (req, res) => {
  try {
    const { uniqId, quantity } = req.body;
    const product = await productsCollection.findOne({ uniqId });
    // console.log(product);

    const bdTime = moment(entry.date).tz("Asia/Dhaka").format("YYYY-MM-DD"); // Convert to Bangladeshi time

    if (product) {
      if (product.stockQuantity >= quantity) {
        const updateProduct = {
          $set: { stockQuantity: product.stockQuantity - quantity },
          $push: { sellHistory: { quantity, date: bdTime } },
        };
        // console.log(updateProduct);
        // update the product in the collection
        await productsCollection.updateOne({ uniqId }, updateProduct);
        product.stockQuantity -= quantity; // Decrease stock quantity
        product.sellHistory.push({ quantity, date: new Date() }); // Add to sell history
      } else {
        res.status(400).json({ message: "Insufficient stock" });
      }
    } else {
      res.status(404).json({ message: "Product not found" });
    }

    // res.json({ message: "Product restocked successfully", updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// product update api create
router.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    // console.log(filter);
    const body = req.body;
    // console.log(body);
    //   console.log(product);
    const updatedProduct = {
      $set: body,
    };
    // console.log(updatedProduct);

    //   // Update the product in the collection
    const result = await productsCollection.updateOne(
      filter,
      updatedProduct,
      options
    );
    res.send(result);
  } catch (error) {}
});

// Delete a product
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await productsCollection.deleteOne(query);
  res.send(result);
});

// see all products
router.get("/", async (req, res) => {
  const result = await productsCollection.find().toArray();
  res.send(result);
});

module.exports = router;
