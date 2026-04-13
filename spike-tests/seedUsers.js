import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { userModel } from "../models/userModel.js";

dotenv.config({ path: "../.env" });

// connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// generate users
const seedUsers = async () => {
  try {
    await userModel.deleteMany({ email: /testuser/ }); // clean old test users

    const users = [];

    for (let i = 1; i <= 100; i++) {
      const hashedPassword = await bcrypt.hash("123456", 10);

      users.push({
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`,
        password: hashedPassword,
        phone: "12345678",
        address: "Test Address",
        answer: "test", // for forgot password
        role: 0, // normal user
      });
    }

    await userModel.insertMany(users);

    console.log("100 test users created successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// run
connectDB().then(seedUsers);
