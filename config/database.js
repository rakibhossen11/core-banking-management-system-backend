const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

// const client = new MongoClient(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
const client = new MongoClient(process.env.MONGO_URI);

const connectDB = async () => {
  try {
    await client.connect();
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

const db = client.db("coreBankingManagement");
const usersCollection = db.collection("users");
const customersCollection = db.collection("customers");
const productsCollection = db.collection("products");
const ordersCollection = db.collection("orders");
const expensesCollection = db.collection("expenses");
// console.log(usersCollection);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// const sendVerificationEmail = async (email, token) => {
//   const verificationUrl = `http://yourwebsite.com/verify-email?token=${token}`;
//   await transporter.sendMail({
//     from: '"Your Site" <noreply@yoursite.com>',
//     to: email,
//     subject: 'Verify Your Email',
//     html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`,
//   });
// };

module.exports = { connectDB, transporter, usersCollection, customersCollection, productsCollection, ordersCollection, expensesCollection,  };