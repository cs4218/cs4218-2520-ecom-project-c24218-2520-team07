// Lin Bin A0258760W
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import { registerController } from "../controllers/authController.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { server, app } from "../server.js";

jest.setTimeout(60000);

// Common test user
const testUser = {
  name: "StageTester",
  email: "stagetester@example.com",
  password: "password123",
  phone: "12345678",
  address: "123 Test Lane",
  DOB: "2000-01-01",
  answer: "Soccer",
};

// ---------------------
// Stage 0: Setup & Teardown
// ---------------------
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "6.0.6" }, // prevents Mac crash
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
  test("registerController successfully creates a new user", async () => {
    const req = { body: testUser };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "User Register Successfully",
      }),
    );

    const userInDB = await userModel.findOne({ email: testUser.email });

    expect(userInDB).not.toBeNull();
    expect(userInDB.password).not.toBe(testUser.password);
  });

  test("registerController fails for duplicate email", async () => {
    await userModel.create(testUser);

    const req = { body: testUser };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Already Register please login",
      }),
    );
  });
});

// ---------------------
// Stage 2: API Route + Backend + DB
// ---------------------
describe("Stage 2: API Route + Backend + Database", () => {
  test("POST /api/v1/auth/register creates a user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const userInDB = await userModel.findOne({ email: testUser.email });

    expect(userInDB).not.toBeNull();
  });

  test("POST /api/v1/auth/register fails for existing user", async () => {
    await userModel.create(testUser);

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
  });
});
