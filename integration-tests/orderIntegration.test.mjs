// Lim Yih Fei A0256993J
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { userModel } from "../models/userModel.js";
import orderModelRaw from "../models/orderModel.js";
const orderModel = orderModelRaw.default || orderModelRaw;

import productModelRaw from "../models/productModel.js";
const productModel = productModelRaw.default || productModelRaw;

import categoryModelRaw from "../models/categoryModel.js";
const categoryModel = categoryModelRaw.default || categoryModelRaw;
import {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../controllers/authController.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { app } from "../server.js";
import JWT from "jsonwebtoken";

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "6.0.6" },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "test" });
  
  // To avoid changing source files, fix the model mismatch between "User" and "users" references here
  if (!mongoose.models.users && mongoose.models.User) {
    mongoose.model("users", mongoose.model("User").schema);
  }
  
  process.env.JWT_SECRET = "testsecret";
});

afterEach(async () => {
  await userModel.deleteMany({});
  await orderModel.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

const generateToken = (userId) => {
  return JWT.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Common mock for Express response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};


describe("Stage 1: Backend Controller + Database", () => {
  
  test("updateProfileController updates user profile data", async () => {
    const user = await userModel.create({
      name: "OldName", email: "test@test.com", password: "password123", phone: "111", address: "OldCity", answer: "ans"
    });
    const req = { user: { _id: user._id }, body: { name: "NewName", phone: "999" } };
    const res = mockResponse();

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile Updated Successfully",
      })
    );

    const updatedUser = await userModel.findById(user._id);
    expect(updatedUser.name).toBe("NewName");
    expect(updatedUser.phone).toBe("999");
  });

  test("getOrdersController fetches the current user's orders", async () => {
    const user = await userModel.create({
      name: "Buyer", email: "user1@test.com", password: "password123", phone: "111", address: "City", answer: "ans"
    });
    await orderModel.create({ buyer: user._id, products: [], payment: { success: true }, status: "Not Process" });
    
    const req = { user: { _id: user._id } };
    const res = mockResponse();

    await getOrdersController(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ buyer: expect.anything(), status: "Not Process" })
      ])
    );
  });

  test("getAllOrdersController fetches all orders (admin capability)", async () => {
    const user = await userModel.create({
      name: "AdminUser", email: "admin@test.com", password: "password123", phone: "111", address: "City", answer: "ans", role: 1
    });
    // Create an order in DB
    await orderModel.create({ buyer: user._id, products: [], payment: { success: true }, status: "Processing" });
    
    const req = {}; // In Stage 1, middleware doesn't run, so we just pass empty
    const res = mockResponse();

    await getAllOrdersController(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    expect(res.json.mock.calls[0][0].length).toBe(1);
    expect(res.json.mock.calls[0][0][0].status).toBe("Processing");
  });

  test("orderStatusController updates a specific order's status", async () => {
    const order = await orderModel.create({
      buyer: new mongoose.Types.ObjectId(), products: [], status: "Not Process"
    });
    
    const req = { params: { orderId: order._id }, body: { status: "Shipped" } };
    const res = mockResponse();

    await orderStatusController(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Shipped" })
    );

    const updatedOrder = await orderModel.findById(order._id);
    expect(updatedOrder.status).toBe("Shipped");
  });
});


describe("Stage 2: API Route + Backend + Database", () => {
  let userToken, adminToken, userId;

  beforeEach(async () => {
    const user = await userModel.create({
      name: "NormalUser", email: "u@u.com", password: "password123", phone: "1", address: "A", answer: "ans", role: 0
    });
    userId = user._id;
    userToken = generateToken(user._id);

    const admin = await userModel.create({
      name: "AdminUser", email: "admin@u.com", password: "password123", phone: "1", address: "A", answer: "ans", role: 1
    });
    adminToken = generateToken(admin._id);
  });

  test("PUT /api/v1/auth/profile updates profile via API successfully", async () => {
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({ name: "UpdatedViaAPI" });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedUser.name).toBe("UpdatedViaAPI");
  });

  test("GET /api/v1/auth/orders fetches user orders via API successfully", async () => {
    await orderModel.create({ buyer: userId, products: [], payment: { success: true }, status: "Shipped" });
    
    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userToken);
      
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("Shipped");
  });

  test("GET /api/v1/auth/all-orders fetches all orders for admin via API successfully", async () => {
    await orderModel.create({ buyer: userId, products: [], status: "deliverd" });
    
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", adminToken);
      
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test("PUT /api/v1/auth/order-status/:orderId updates status via admin API successfully", async () => {
    const order = await orderModel.create({ buyer: userId, products: [], status: "Not Process" });
    
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${order._id}`)
      .set("Authorization", adminToken)
      .send({ status: "Shipped" });
      
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Shipped");
  });

  test("GET /api/v1/auth/all-orders denies UnAuthorized Access for non-admin", async () => {
    // Normal user token trying to access admin route
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", userToken);
      
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
