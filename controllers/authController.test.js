// Lin Bin A0258760W

// __tests__/authController.test.js
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";

// Mock userModel methods
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {}); // suppress all console.log
});

afterAll(() => {
  console.log.mockRestore(); // restore original console.log after tests
});

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("registerController", () => {
    it("should return error if name is missing", async () => {
      req.body = {
        email: "a@b.com",
        password: "123",
        phone: "123",
        address: "addr",
        answer: "ans",
      };
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    it("should return error if email is missing", async () => {
      req.body = {
        name: "Test",
        password: "123",
        phone: "123",
        address: "addr",
        answer: "ans",
      };
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    it("should return error if password is missing", async () => {
      req.body = {
        name: "Test",
        email: "a@b.com",
        phone: "123",
        address: "addr",
        answer: "ans",
      };
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Password is Required",
      });
    });

    it("should return error if phone is missing", async () => {
      req.body = {
        name: "Test",
        email: "a@b.com",
        password: "123",
        address: "addr",
        answer: "ans",
      };
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Phone no is Required",
      });
    });

    it("should return error if address is missing", async () => {
      req.body = {
        name: "Test",
        email: "a@b.com",
        password: "123",
        phone: "123",
        answer: "ans",
      };
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
    });

    it("should return error if answer is missing", async () => {
      req.body = {
        name: "Test",
        email: "a@b.com",
        password: "123",
        phone: "123",
        address: "addr",
      };
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
    });

    it("should return error when user already exists", async () => {
      req.body = {
        name: "Test",
        email: "a@b.com",
        password: "123",
        phone: "123",
        address: "addr",
        answer: "ans",
      };
      userModel.findOne.mockResolvedValue({ email: "a@b.com" });
      await registerController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
    });

    it("should register a new user successfully", async () => {
      req.body = {
        name: "Test",
        email: "new@b.com",
        password: "123",
        phone: "123",
        address: "addr",
        answer: "ans",
      };
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed123");
      userModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
          _id: "id123",
          ...req.body,
          password: "hashed123",
        }),
      }));
      await registerController(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should handle exceptions", async () => {
      req.body = {
        name: "Test",
        email: "new@b.com",
        password: "123",
        phone: "123",
        address: "addr",
        answer: "ans",
      };
      userModel.findOne.mockRejectedValue(new Error("DB Error"));
      await registerController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });
  });

  describe("loginController", () => {
    it("should return 404 if email is missing", async () => {
      req.body = { password: "123" }; // no email
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid email or password",
        }),
      );
    });

    it("should return 404 if password is missing", async () => {
      req.body = { email: "a@b.com" }; // no password
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid email or password",
        }),
      );
    });

    it("should return 404 if user not found", async () => {
      req.body = { email: "notfound@b.com", password: "123" };
      userModel.findOne.mockResolvedValue(null);
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it("should return 200 for incorrect password", async () => {
      req.body = { email: "a@b.com", password: "wrong" };
      userModel.findOne.mockResolvedValue({ password: "hashed", _id: "id123" });
      comparePassword.mockResolvedValue(false);
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it("should login successfully", async () => {
      req.body = { email: "a@b.com", password: "123" };
      const user = {
        password: "hashed",
        _id: "id123",
        name: "Test",
        email: "a@b.com",
        phone: "123",
        address: "addr",
        role: 0,
      };
      userModel.findOne.mockResolvedValue(user);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("token123");
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, token: "token123" }),
      );
    });

    it("should handle exceptions", async () => {
      req.body = { email: "a@b.com", password: "123" };
      userModel.findOne.mockRejectedValue(new Error("DB Error"));
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });
  });

  describe("forgotPasswordController", () => {
    it("should validate required fields", async () => {
      req.body = {};
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if email+answer combination is wrong", async () => {
      req.body = { email: "a@b.com", answer: "wrong", newPassword: "new" };
      userModel.findOne.mockResolvedValue(null);
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reset password successfully", async () => {
      req.body = { email: "a@b.com", answer: "ans", newPassword: "new" };
      const user = { _id: "id123" };
      userModel.findOne.mockResolvedValue(user);
      hashPassword.mockResolvedValue("hashedNew");
      userModel.findByIdAndUpdate.mockResolvedValue({});
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should handle exceptions", async () => {
      req.body = { email: "a@b.com", answer: "ans", newPassword: "new" };
      userModel.findOne.mockRejectedValue(new Error("DB Error"));
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });
  });

  describe("testController", () => {
    it("should send protected route response", () => {
      testController(req, res);
      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should handle errors in the catch block", () => {
      // Mock res.send to throw an error to trigger the catch block
      const error = new Error("Send failed");
      res.send = jest.fn(() => {
        throw error;
      });
      console.log = jest.fn(); // mock console.log to suppress output

      // Wrap in try/catch to prevent Jest from crashing
      try {
        testController(req, res);
      } catch (e) {
        // We ignore it because we just want to test console.log in catch
      }

      // Check that console.log was called with the error
      expect(console.log).toHaveBeenCalledWith(error);
    });
  });
});
