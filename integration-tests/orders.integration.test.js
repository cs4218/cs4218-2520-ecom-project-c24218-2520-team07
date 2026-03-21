import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from '../routes/authRoute.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js'; // Added to register Products schema
import JWT from 'jsonwebtoken';
import { hashPassword } from '../helpers/authHelper.js';

let mongoServer;
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

const generateToken = (userId) => {
  return JWT.sign({ _id: userId }, process.env.JWT_SECRET || "testsecret", { expiresIn: '1h' });
};

describe("Order Components Integration Tests (Backend)", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "testsecret";
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  });

  describe("PUT /api/v1/auth/profile", () => {
    it("should update the user profile successfully in the database", async () => {
      const hashedPassword = await hashPassword("password123");
      const user = await new userModel({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        phone: "1234567890",
        address: "123 Test St",
        answer: "test",
        role: 0
      }).save();

      const token = generateToken(user._id);

      const res = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Updated Name",
          phone: "0987654321",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedUser.name).toBe("Updated Name");
      
      const dbUser = await userModel.findById(user._id);
      expect(dbUser.name).toBe("Updated Name");
    });
  });

  describe("GET /api/v1/auth/orders", () => {
    it("should get orders and successfully populate product and buyer for the logged-in user", async () => {
      const user = await new userModel({
        name: "Buyer",
        email: "buyer@example.com",
        password: "hashedpassword",
        phone: "111",
        address: "Address",
        answer: "ans"
      }).save();

      const order1 = await new orderModel({
        products: [], 
        buyer: user._id,
        status: "Not Process",
        payment: { success: true }
      }).save();

      const token = generateToken(user._id);

      const res = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id.toString()).toBe(order1._id.toString());
      expect(res.body[0].buyer.name).toBe("Buyer");
    });
  });

  describe("GET /api/v1/auth/all-orders", () => {
    it("should get all orders for an admin and apply correct sorted layout", async () => {
      const admin = await new userModel({
        name: "Admin",
        email: "admin@example.com",
        password: "hashedpassword",
        phone: "111",
        address: "Address",
        answer: "ans",
        role: 1 
      }).save();

      const order1 = await new orderModel({
        products: [],
        buyer: admin._id,
        status: "Processing"
      }).save();

      const token = generateToken(admin._id);

      const res = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id.toString()).toBe(order1._id.toString());
    });
    
    it("should not allow normal users to get all orders", async () => {
      const user = await new userModel({
        name: "User",
        email: "user@example.com",
        password: "hashedpassword",
        phone: "111",
        address: "Address",
        answer: "ans",
        role: 0
      }).save();

      const token = generateToken(user._id);

      const res = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(res.statusCode).toBe(401); 
    });
  });

  describe("PUT /api/v1/auth/order-status/:orderId", () => {
    it("should update order status accurately for an admin", async () => {
      const admin = await new userModel({
        name: "Admin",
        email: "admin2@example.com",
        password: "hashedpassword",
        phone: "111",
        address: "Address",
        answer: "ans",
        role: 1
      }).save();

      const order = await new orderModel({
        products: [],
        buyer: admin._id,
        status: "Not Process"
      }).save();

      const token = generateToken(admin._id);

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Shipped" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("Shipped");

      const dbOrder = await orderModel.findById(order._id);
      expect(dbOrder.status).toBe("Shipped");
    });
  });
});
