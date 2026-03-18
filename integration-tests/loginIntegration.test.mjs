// Lin Bin A0258760W
import mongoose from "mongoose";
import { userModel } from "../models/userModel.js";
import { loginController } from "../controllers/authController.js";
import { hashPassword } from "../helpers/authHelper.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { server, app } from "../server.js";
import { jest } from "@jest/globals";

// Increase timeout for MongoMemoryServer startup
jest.setTimeout(60000);

// Test user credentials
const testUser = {
  name: "LoginTester",
  email: "logintester@example.com",
  password: "password123",
  phone: "12345678",
  address: "Test Address",
  answer: "blue",
};

// ---------------------
// Stage 0: Setup & Teardown
// ---------------------
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "6.0.6" }, // prevents Mac M1 crash
  });

  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    dbName: "test",
  });
});

afterEach(async () => {
  await userModel.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ---------------------
// Stage 1: Backend Controller + DB
// ---------------------
describe("Stage 1: Backend Controller + Database", () => {
  test("loginController succeeds with correct credentials", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    await userModel.create({ ...testUser, password: hashedPassword });

    const req = {
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        user: expect.any(Object),
        token: expect.any(String),
      }),
    );
  });

  test("loginController fails with incorrect password", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    await userModel.create({ ...testUser, password: hashedPassword });

    const req = {
      body: {
        email: testUser.email,
        password: "wrongpassword",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid Password",
      }),
    );
  });

  test("loginController fails for non-existent user", async () => {
    const req = {
      body: {
        email: "nouser@example.com",
        password: "any",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Email is not registered",
      }),
    );
  });
});

// ---------------------
// Stage 2: API Route + Backend + DB
// ---------------------
describe("Stage 2: API Route + Backend + Database", () => {
  test("POST /api/v1/auth/login succeeds with correct credentials", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    await userModel.create({ ...testUser, password: hashedPassword });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  test("POST /api/v1/auth/login fails with incorrect password", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    await userModel.create({ ...testUser, password: hashedPassword });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: "wrongpassword",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid Password");
  });

  test("POST /api/v1/auth/login fails with unregistered email", async () => {
    // Ensure the user database is empty or does not contain this email
    await userModel.deleteMany({});

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "nouser@example.com",
      password: "anyPassword123",
    });

    expect(response.status).toBe(404); // Or the status your controller uses for unregistered email
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is not registered"); // Match your controller's message
  });
});
