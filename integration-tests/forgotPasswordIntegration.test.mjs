// Lin Bin A0258760W
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { userModel } from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { forgotPasswordController } from "../controllers/authController.js";
import { server, app } from "../server.js"; // Express app
import request from "supertest";
import { jest } from "@jest/globals";

// Increase Jest timeout for MongoMemoryServer startup
jest.setTimeout(60000);

// ---------------------
// Test user
// ---------------------
const testUser = {
  name: "ForgotPasswordTester",
  email: "forgottester@example.com",
  password: "password123",
  phone: "12345678",
  address: "123 Test Lane",
  answer: "Soccer",
};

// ---------------------
// Stage 0: Setup & Teardown
// ---------------------
let mongoServer;

beforeAll(async () => {
  // Create a stable Mongo binary for Mac M1/M2
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "6.0.6", skipMD5: true },
  });

  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    dbName: "test",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Insert initial test user with hashed password
  const hashedPassword = await hashPassword(testUser.password);
  await userModel.create({ ...testUser, password: hashedPassword });
}, 60000); // 60s timeout

afterEach(async () => {
  // Clear all users after each test
  await userModel.deleteMany({});
});

afterAll(async () => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

// ---------------------
// Stage 1: Controller + DB
// ---------------------
describe("Stage 1: forgotPasswordController + DB", () => {
  test("resets password successfully for existing user with correct answer", async () => {
    const req = {
      body: {
        email: testUser.email,
        answer: testUser.answer,
        newPassword: "newpass123",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Password Reset Successfully",
      }),
    );
  });

  test("fails when email not registered", async () => {
    const req = {
      body: { email: "nouser@example.com", answer: "any", newPassword: "pass" },
    };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Wrong Email Or Answer",
      }),
    );
  });

  test("fails when answer is incorrect", async () => {
    const req = {
      body: {
        email: testUser.email,
        answer: "wronganswer",
        newPassword: "pass",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Wrong Email Or Answer",
      }),
    );
  });

  test("fails when email is empty", async () => {
    const req = {
      body: { email: "", answer: "any", newPassword: "pass" },
    };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400); // Bad Request
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Email is required",
      }),
    );
  });

  test("fails when answer is empty", async () => {
    const req = {
      body: { email: testUser.email, answer: "", newPassword: "pass" },
    };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400); // Bad Request
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Answer is required",
      }),
    );
  });
});

// ---------------------
// Stage 2: API Route + Backend + DB
// ---------------------
describe("Stage 2: API Route + Backend + Database", () => {
  test("POST /api/v1/auth/forgot-password succeeds for correct email and answer", async () => {
    // Re-insert test user before API test
    const hashedPassword = await hashPassword(testUser.password);
    await userModel.create({ ...testUser, password: hashedPassword });

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: testUser.email,
        answer: testUser.answer,
        newPassword: "newpass123",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Password Reset Successfully");
  });

  test("POST /api/v1/auth/forgot-password fails for wrong answer", async () => {
    // Re-insert test user before API test
    const hashedPassword = await hashPassword(testUser.password);
    await userModel.create({ ...testUser, password: hashedPassword });

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: testUser.email,
        answer: "wronganswer",
        newPassword: "newpass123",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Wrong Email Or Answer");
  });

  test("POST /api/v1/auth/forgot-password fails for unregistered email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "nouser@example.com",
        answer: "any",
        newPassword: "newpass123",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Wrong Email Or Answer");
  });

  test("POST /api/v1/auth/forgot-password fails for empty email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "",
        answer: "any",
        newPassword: "newpass123",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is required");
  });

  test("POST /api/v1/auth/forgot-password fails for empty answer", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: testUser.email,
        answer: "",
        newPassword: "newpass123",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Answer is required");
  });
});
