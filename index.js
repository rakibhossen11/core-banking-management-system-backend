const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const moment = require("moment-timezone"); // Import moment-timezone
const port = process.env.PORT || 5000;

dotenv.config();

// coreBankingManagement
// Doiz5Fm03ybZH7Qj

// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const uri =
  "mongodb+srv://coreBankingManagement:Doiz5Fm03ybZH7Qj@cluster0.0dt9tdk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client
      .db("coreBankingManagement")
      .collection("users");
    const productsCollection = client
      .db("coreBankingManagement")
      .collection("products");
    const expensesCollection = client
      .db("coreBankingManagement")
      .collection("expenses");
    const ordersCollection = client
      .db("coreBankingManagement")
      .collection("orders");

    // user related api starts from here

    app.post("/register", async (req, res) => {
      try {
        const { clientId, name, email, phone, password } = req.body;
        console.log(clientId, name, email, phone, password);

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        console.log(existingUser);

        // let clientId = 'INCD' + 1;

        if (existingUser) {
          return res.status(400).json({ message: "User already exists!" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let balance = 0;

        // Save user to database
        const newUser = {
          clientId,
          name,
          email,
          phone,
          balance,
          password: hashedPassword,
        };
        console.log(newUser);
        const result = await usersCollection.insertOne(newUser);

        res.json({ message: "User registered successfully!", result });
      } catch (error) {
        // res.status(500).json({ message: "server error", error });
      }
    });

    app.post("/login", async (req, res) => {
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
      const validPassword = bcrypt.compare(
        user.password,
        existingUser.password
      );
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      res.json({ message: "Login successful" });
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // user transaction api
    app.post("/users/transaction", async (req, res) => {
      try {
        const { clientId, amount, type, description } = req.body;
        console.log(clientId, amount, type, description);

        // valid transaction type
        if (!["debit", "credit"].includes(type)) {
          return res.status(400).json({ error: "Invalid transaction type" });
        }

        // check if the client exists
        const user = await usersCollection.findOne({ clientId });
        console.log(user);

        // find or create a balance document for the client
        // let balance = await usersCollection.findOne({clientId});
        // console.log("balance",balance);

        // if(!balance || balance == NaN || balance == null){
        //   balance = new balance({clientId, balance:0});
        //   return 0;
        // }

        if (!user) {
        } else {
          const bdTime = moment().tz("Asia/Dhaka").format("DD-MM-YYYY hh:mm A"); // Convert to Bangladeshi time
          console.log(bdTime);

          const updateUser = {
            $set: { balance: parseFloat(user.balance) + parseFloat(amount) },
            $push: { transaction: { amount, type, date: bdTime } },
          };

          console.log(updateUser);

          // update the user in the collection
          await usersCollection.updateOne({ clientId }, updateUser);
          // user.balance += amount;
          // user.transaction.push({ amount, date: bdTime, })
        }
        res
          .status(200)
          .json({ message: "Transaction successful!", updateUser });
      } catch (error) {}
    });

    // Delete a product
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // user related api end from here

    // ---------------------------------------
    // ---------------------------------------
    // ---------------------------------------
    // products related api creation start here
    // add products
    // app.post("/products", async (req, res) => {
    //   try {
    //     const product = req.body;
    //     console.log(product);
    //     // if (!product.name || !product.price || !product.quantity) {
    //     //   return res.status(400).json({ message: "All fields are required" });
    //     // }
    //     const result = await productsCollection.insertOne(product);
    //     res.status(201).json({ message: "Product added succesfully", result });
    //   } catch (error) {
    //     res.status(500).json({ message: "server error", error });
    //   }
    //   // const products = req.body;
    //   // console.log(products);
    //   // const result = await productsCollection.insertOne(products);
    //   // res.send(result);
    // });

    app.post("/products", async (req, res) => {
      try {
        const lastProduct = await productsCollection
          .find()
          .sort({ productId: -1 })
          .limit(1)
          .toArray();
        console.log(lastProduct);
        const lastProductId =
          lastProduct.length > 0
            ? parseInt(lastProduct[0].productId, 10)
            : 10000;
        console.log(lastProduct);
        const newProductId = lastProductId + 1;
        console.log(newProductId);

        const product = {
          ...req.body,
          productId: newProductId,
          createdAtDate: moment().tz("Asia/Dhaka").format("YYYY-MM-DD"),
          createdAtTime: moment().tz("Asia/Dhaka").format("HH:mm A"),
        };

        console.log(product);

        const result = await productsCollection.insertOne(product);
        res.status(201).json({ message: "Product added successfully", result });
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });

    app.get("/products/by-date", async (req, res) => {
      try {
        const { date } = req.query; // Expect date in format YYYY-MM-DD
        console.log(date);
        const products = await productsCollection
          .find({ createdAtDate: { $regex: `^${date}` } })
          .toArray();
        console.log(products);
        res.status(200).json(products);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });

    // product details api
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // buy product increase quantity
    app.post("/products/buy", async (req, res) => {
      try {
        const { uniqId, quantity } = req.body;
        console.log(uniqId, quantity);
        const product = await productsCollection.findOne({ uniqId });
        console.log("Before", product.stockQuantity);
        console.log("middle", product.stockQuantity + 10);
        console.log("After", parseInt(product.stockQuantity) + 30);

        if (!product) {
        } else {
          // Get current time in Bangladeshi local time (BST)
          const bdDate = moment().tz("Asia/Dhaka").format("YYYY-MM-DD"); //.format("YYYY-MM-DD HH:mm A"); with time
          const updateProduct = {
            $set: { stockQuantity: product.stockQuantity + quantity },
            $push: { buyHistory: { quantity, date: bdDate } },
          };

          console.log(updateProduct);

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
    app.post("/products/sell", async (req, res) => {
      try {
        const { uniqId, quantity } = req.body;
        const product = await productsCollection.findOne({ uniqId });
        console.log(product);

        const bdTime = moment(entry.date).tz("Asia/Dhaka").format("YYYY-MM-DD"); // Convert to Bangladeshi time

        if (product) {
          if (product.stockQuantity >= quantity) {
            const updateProduct = {
              $set: { stockQuantity: product.stockQuantity - quantity },
              $push: { sellHistory: { quantity, date: bdTime } },
            };
            console.log(updateProduct);
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
    app.put("/products/update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        console.log(filter);
        const body = req.body;
        console.log(body);
        //   console.log(product);
        const updatedProduct = {
          $set: body,
        };
        console.log(updatedProduct);

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
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // see all products
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // products related api creation end here

    // order related api start from here
    // app.post("/orders", async (req, res) => {
    //   try {
    //     const { orderData } = req.body;
    //     console.log(orderData.products);
    //     // Validate products and decrease stock quantities
    //     for (const order of orderData.products) {
    //       const id = order.id;
    //       const product = await productsCollection.findOne({
    //         productId: id,
    //       });
    //       console.log(product.stockQuantity);
    //       console.log(order.quantity);
    //       console.log(product.stockQuantity - order.quantity);
    //       // Decrease stock and add to sell history
    //       // product.stockQuantity -= order.quantity;
    //       // product.sellHistory.push({ quantity: order.quantity, date: new Date() })
    //     }
    //   } catch (err) {
    //     res.status(500).json({ message: err.message });
    //   }
    // });
    app.post("/orders", async (req, res) => {
      try {
        const { orderData } = req.body;

        // Loop through each product in the order
        for (const order of orderData.products) {
          console.log(order);
          const product = await productsCollection.findOne({
            productId: order.id, // Fix: Use productId instead of id
          });
          console.log(product);

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

    app.put("/orders/update-status", async (req, res) => {
      const { orderId, status } = req.body;
      console.log(orderId, status);

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
        console.error("Error updating order status:", err);
        res.status(500).json({ message: "Failed to update order status" });
      }
    });

    app.delete("/orders/delete", async (req, res) => {
      const { orderIds } = req.body;
      console.log(orderIds);

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

    app.get("/orders", async (req, res) => {
      const { status } = req.query;
      console.log(status); // Debugging: Log the status query parameter

      try {
        let query = {};
        if (status) {
          query = { status: status }; // Add status to the query if it exists
        }

        const result = await ordersCollection.find(query).toArray(); // Filter orders based on the query
        console.log(result);
        res.send(result);
      } catch (error) {
        console.error("Error fetching orders:", error); // Log the error for debugging
        res
          .status(500)
          .send({ message: "Internal Server Error", error: error.message });
      }
    });
    // order related api end from here

    // expenses related api start here

    app.post("/expenses", async (req, res) => {
      const { type, amount } = req.body;
      // console.log(body);
      const date = moment().tz("Asia/Dhaka").format("YYYY-MM-DD"); //.format("YYYY-MM-DD HH:mm A"); with time
      console.log(date);
      const expens = { type, amount, date };
      const result = await expensesCollection.insertOne(expens);
      res.send(result);
    });

    //  app.get('/expenses', async (req,res) => {
    //   const expenses = await expensesCollection.find().toArray();
    //   res.send(expenses);
    //  });

    //  API for fetch data by month
    app.get("/expenses", async (req, res) => {
      try {
        const { month } = req.query; // e.g., 1 for January, 2 for February
        const year = moment().tz("Asia/Dhaka").year(); // Current year in BD time
        console.log(year);
        console.log(month);
        if (!month) {
          return res
            .status(400)
            .json({ message: "Month parameter is required" });
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
        console.log(startDate);
        console.log(endDate);

        // Retrieve data for the given month
        const expenses = await expensesCollection
          .find({
            date: { $gte: startDate, $lte: endDate },
          })
          .sort({ date: -1 });
        console.log(expenses);
        res.json(expenses);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });

    app.get("/expenses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await expensesCollection.findOne(query);
      res.send(result);
    });

    app.put("/expenses/:id", async (req, res) => {
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

    app.delete("/expenses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await expensesCollection.deleteOne(query);
      res.send(result);
    });

    // expenses related api end here

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("core banking server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
