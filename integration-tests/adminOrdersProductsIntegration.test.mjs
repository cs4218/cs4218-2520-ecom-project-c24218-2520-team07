// Admin Orders and Products Integration Tests
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
  getAllOrdersController,
  orderStatusController,
} from "../controllers/authController.js";
import {
  getProductController,
} from "../controllers/productController.js";
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
  
  if (!mongoose.models.users && mongoose.models.User) {
    mongoose.model("users", mongoose.model("User").schema);
  }
});

afterEach(async () => {
  await userModel.deleteMany({});
  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
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

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};


describe("AdminOrders Integration Tests - Stage 1: Backend Controller + Database", () => {
  test("getAllOrdersController fetches all orders with populated buyer and products", async () => {
    const buyer = await userModel.create({
      name: "BuyerUser",
      email: "buyer@test.com",
      password: "password123",
      phone: "12345678",
      address: "123 Buyer St",
      answer: "yes",
    });

    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const product = await productModel.create({
      name: "Test Product",
      slug: "test-product",
      description: "Test description",
      price: 99.99,
      category: category._id,
      quantity: 10,
      shipping: true,
    });

    await orderModel.create({
      buyer: buyer._id,
      products: [product._id],
      payment: { success: true, transactionId: "txn_123" },
      status: "Not Process",
    });

    const req = {};
    const res = mockResponse();

    await getAllOrdersController(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    const orders = res.json.mock.calls[0][0];
    expect(orders.length).toBe(1);
    expect(orders[0].buyer.name).toBe("BuyerUser");
    expect(orders[0].status).toBe("Not Process");
  });

  test("orderStatusController updates order status to Processing", async () => {
    const buyer = await userModel.create({
      name: "BuyerUser2",
      email: "buyer2@test.com",
      password: "password123",
      phone: "12345678",
      address: "123 Buyer St",
      answer: "yes",
    });

    const order = await orderModel.create({
      buyer: buyer._id,
      products: [],
      status: "Not Process",
    });

    const req = { params: { orderId: order._id }, body: { status: "Processing" } };
    const res = mockResponse();

    await orderStatusController(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Processing" }));

    const updatedOrder = await orderModel.findById(order._id);
    expect(updatedOrder.status).toBe("Processing");
  });

  test("orderStatusController updates order status to Shipped", async () => {
    const buyer = await userModel.create({
      name: "BuyerUser3",
      email: "buyer3@test.com",
      password: "password123",
      phone: "12345678",
      address: "123 Buyer St",
      answer: "yes",
    });

    const order = await orderModel.create({
      buyer: buyer._id,
      products: [],
      status: "Processing",
    });

    const req = { params: { orderId: order._id }, body: { status: "Shipped" } };
    const res = mockResponse();

    await orderStatusController(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Shipped" }));

    const updatedOrder = await orderModel.findById(order._id);
    expect(updatedOrder.status).toBe("Shipped");
  });

  test("orderStatusController updates order status to delivered", async () => {
    const buyer = await userModel.create({
      name: "BuyerUser4",
      email: "buyer4@test.com",
      password: "password123",
      phone: "12345678",
      address: "123 Buyer St",
      answer: "yes",
    });

    const order = await orderModel.create({
      buyer: buyer._id,
      products: [],
      status: "Shipped",
    });

    const req = { params: { orderId: order._id }, body: { status: "deliverd" } };
    const res = mockResponse();

    await orderStatusController(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "deliverd" }));

    const updatedOrder = await orderModel.findById(order._id);
    expect(updatedOrder.status).toBe("deliverd");
  });
});


describe("AdminOrders Integration Tests - Stage 2: API Route + Backend + Database", () => {
  let adminToken;
  let userToken;
  let orderId;

  beforeEach(async () => {
    const admin = await userModel.create({
      name: "AdminUser",
      email: "admin@test.com",
      password: "password123",
      phone: "12345678",
      address: "Admin Address",
      answer: "yes",
      role: 1,
    });
    adminToken = generateToken(admin._id);

    const user = await userModel.create({
      name: "NormalUser",
      email: "user@test.com",
      password: "password123",
      phone: "12345678",
      address: "User Address",
      answer: "yes",
      role: 0,
    });
    userToken = generateToken(user._id);

    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const product = await productModel.create({
      name: "Test Product",
      slug: "test-product",
      description: "Test description",
      price: 99.99,
      category: category._id,
      quantity: 10,
      shipping: true,
    });

    const order = await orderModel.create({
      buyer: user._id,
      products: [product._id],
      payment: { success: true, transactionId: "txn_123" },
      status: "Not Process",
    });
    orderId = order._id;
  });

  test("GET /api/v1/auth/all-orders returns all orders for admin with customer details", async () => {
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("Not Process");
    expect(res.body[0].buyer.name).toBe("NormalUser");
    expect(res.body[0].payment.success).toBe(true);
  });

  test("PUT /api/v1/auth/order-status/:orderId updates order status via API", async () => {
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${orderId}`)
      .set("Authorization", adminToken)
      .send({ status: "Processing" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Processing");

    const updatedOrder = await orderModel.findById(orderId);
    expect(updatedOrder.status).toBe("Processing");
  });

  test("GET /api/v1/auth/all-orders denies access for non-admin users", async () => {
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", userToken);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("PUT /api/v1/auth/order-status/:orderId denies access for non-admin users", async () => {
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${orderId}`)
      .set("Authorization", userToken)
      .send({ status: "Shipped" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});


describe("Products Integration Tests - Stage 1: Backend Controller + Database", () => {
  test("getProductController returns all products with correct data", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    await productModel.create([
      {
        name: "Laptop",
        slug: "laptop",
        description: "High-end laptop",
        price: 1299.99,
        category: category._id,
        quantity: 5,
        shipping: true,
      },
      {
        name: "Smartphone",
        slug: "smartphone",
        description: "Latest smartphone",
        price: 799.99,
        category: category._id,
        quantity: 10,
        shipping: true,
      },
      {
        name: "Tablet",
        slug: "tablet",
        description: "Portable tablet",
        price: 499.99,
        category: category._id,
        quantity: 8,
        shipping: true,
      },
    ]);

    const req = {};
    const res = mockResponse();

    await getProductController(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
    const response = res.send.mock.calls[0][0];
    expect(response.products.length).toBe(3);
    
    const productNames = response.products.map(p => p.name);
    expect(productNames).toContain("Laptop");
    expect(productNames).toContain("Smartphone");
    expect(productNames).toContain("Tablet");
  });

  test("getProductController returns products with accurate price and quantity", async () => {
    const category = await categoryModel.create({
      name: "Books",
      slug: "books",
    });

    await productModel.create({
      name: "JavaScript Guide",
      slug: "javascript-guide",
      description: "Complete JS guide",
      price: 49.99,
      category: category._id,
      quantity: 100,
      shipping: false,
    });

    const req = {};
    const res = mockResponse();

    await getProductController(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
    const response = res.send.mock.calls[0][0];
    expect(response.products.length).toBe(1);
    expect(response.products[0].name).toBe("JavaScript Guide");
    expect(response.products[0].price).toBe(49.99);
    expect(response.products[0].quantity).toBe(100);
  });

  test("getProductController returns empty array when no products exist", async () => {
    const req = {};
    const res = mockResponse();

    await getProductController(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
    const response = res.send.mock.calls[0][0];
    expect(response.products.length).toBe(0);
  });
});


describe("Products Integration Tests - Stage 2: API Route + Backend + Database", () => {
  beforeEach(async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    await productModel.create([
      {
        name: "Laptop",
        slug: "laptop",
        description: "High-end laptop",
        price: 1299.99,
        category: category._id,
        quantity: 5,
        shipping: true,
      },
      {
        name: "Smartphone",
        slug: "smartphone",
        description: "Latest smartphone",
        price: 799.99,
        category: category._id,
        quantity: 10,
        shipping: true,
      },
    ]);
  });

  test("GET /api/v1/product/get-product returns all products via API with accurate count", async () => {
    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);
    expect(res.body.counTotal).toBe(2);
    
    const productNames = res.body.products.map(p => p.name);
    expect(productNames).toContain("Laptop");
    expect(productNames).toContain("Smartphone");
  });

  test("GET /api/v1/product/get-product returns products with accurate data", async () => {
    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    const laptop = res.body.products.find(p => p.name === "Laptop");
    expect(laptop).toBeDefined();
    expect(laptop.price).toBe(1299.99);
    expect(laptop.quantity).toBe(5);
    expect(laptop.slug).toBe("laptop");
  });

  test("GET /api/v1/product/get-product returns empty array when no products", async () => {
    await productModel.deleteMany({});

    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(0);
  });
});
