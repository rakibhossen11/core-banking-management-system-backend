const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const moment = require('moment-timezone'); // Import moment-timezone
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

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      console.log(existingUser);
      if (existingUser) {
        res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
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

    // ---------------------------------------
    // ---------------------------------------
    // ---------------------------------------
    // products related api creation start here
    // add products
    app.post("/products", async (req, res) => {
      try {
        const product = req.body;
        console.log(product);
        // if (!product.name || !product.price || !product.quantity) {
        //   return res.status(400).json({ message: "All fields are required" });
        // }
        const result = await productsCollection.insertOne(product);
        res.status(201).json({ message: "Product added succesfully", result });
      } catch (error) {
        res.status(500).json({ message: "server error", error });
      }
      // const products = req.body;
      // console.log(products);
      // const result = await productsCollection.insertOne(products);
      // res.send(result);
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
          // const bdTime = moment().tz('Asia/Dhaka').toDate(); // Convert to Bangladeshi time
          // console.log(bdTime);
          const updateProduct = {
            $set: { stockQuantity: product.stockQuantity + quantity },
            $push: { buyHistory: { quantity, date: new Date() } },
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
    app.post("/products/sell", async (req, res) => {
      try {
        const { uniqId, quantity } = req.body;
        const product = await productsCollection.findOne({ uniqId });
        console.log(product);

        if (product) {
          if (product.stockQuantity >= quantity) {
            const updateProduct = {
              $set: { stockQuantity: product.stockQuantity - quantity },
              $push: { sellHistory: { quantity, date: new Date() } },
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
    app.put('/products/update/:id', async(req,res) =>{
      try {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const options = {upsert: true};
        console.log(filter);
        const body = req.body;
        console.log(body);
      //   console.log(product);
        const updatedProduct = {
          $set: body
        }
        console.log(updatedProduct);

      //   // Update the product in the collection
      const result = await productsCollection.updateOne(filter,updatedProduct,options);
      res.send(result);
      } catch (error) {
        
      }
    });

    // see all products
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // products related api creation end here

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

// const express = require("express");
// const app = express();
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// dotenv.config();
// const port = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());

// const uri =
//   "mongodb+srv://coreBankingManagement:Doiz5Fm03ybZH7Qj@cluster0.0dt9tdk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();

//     const usersCollection = client
//       .db("coreBankingManagement")
//       .collection("users");
//     const productsCollection = client
//       .db("coreBankingManagement")
//       .collection("products");

//     // User Registration Route
//     app.post("/register", async (req, res) => {
//       const { name, email, password } = req.body;

//       // Check if user already exists
//       const existingUser = await usersCollection.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({ message: "User already exists!" });
//       }

//       // Hash password
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);

//       // Save user to database
//       const newUser = { name, email, password: hashedPassword };
//       const result = await usersCollection.insertOne(newUser);

//       res.json({ message: "User registered successfully!", result });
//     });

//     // User Login Route
//     app.post("/login", async (req, res) => {
//       const { email, password } = req.body;

//       // Find user
//       const user = await usersCollection.findOne({ email });
//       if (!user) {
//         return res.status(401).json({ message: "Invalid email or password" });
//       }

//       // Compare password
//       const validPassword = await bcrypt.compare(password, user.password);
//       if (!validPassword) {
//         return res.status(401).json({ message: "Invalid email or password" });
//       }

//       // Generate JWT Token
//       const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//         expiresIn: "1h",
//       });

//       res.json({ message: "Login successful", token });
//     });

//     // Middleware to verify JWT Token
//     function verifyToken(req, res, next) {
//       const token = req.headers["authorization"];
//       if (!token) {
//         return res.status(403).json({ message: "No token provided" });
//       }

//       jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//         if (err) {
//           return res.status(401).json({ message: "Unauthorized" });
//         }
//         req.userId = decoded.id;
//         next();
//       });
//     }

//     // Protected Route Example
//     app.get("/dashboard", verifyToken, (req, res) => {
//       res.json({ message: "Welcome to the protected dashboard!" });
//     });

//     // Existing Routes
//     app.post("/users", async (req, res) => {
//       const user = req.body;
//       const query = { email: user.email };
//       const existingUser = await usersCollection.findOne(query);
//       console.log(existingUser);
//       if (existingUser) {
//         res.send({ message: "User already exists" });
//       }
//       const result = await usersCollection.insertOne(user);
//       res.send(result);
//     });

//     app.get("/users", async (req, res) => {
//       const result = await usersCollection.find().toArray();
//       res.send(result);
//     });

//     app.post("/products", async (req, res) => {
//       const products = req.body;
//       console.log(products);
//       const result = await productsCollection.insertOne(products);
//       res.send(result);
//     });

//     app.get("/products", async (req, res) => {
//       const result = await productsCollection.find().toArray();
//       res.send(result);
//     });

//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Do not close the connection in a long-running server
//   }
// }
// run().catch(console.dir);

// app.get("/", (req, res) => {
//   res.send("Core banking server is running");
// });

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
