// Lin Bin A0258760W

import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Mock userModel
jest.mock("../models/userModel.js");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("requireSignIn", () => {
    it("should call next() and attach decoded user when token is valid", () => {
      req.headers.authorization = "validToken";
      const decoded = { _id: "userId123" };

      jest.spyOn(JWT, "verify").mockReturnValue(decoded);

      requireSignIn(req, res, next);

      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });

    it("should log error and not call next() when token is invalid", () => {
      req.headers.authorization = "invalidToken";
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      jest.spyOn(JWT, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      requireSignIn(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(next).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log error when no token is provided", () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      requireSignIn(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(next).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("isAdmin", () => {
    it("should call next() when user is admin", async () => {
      req.user = { _id: "userId123" };
      userModel.findById.mockResolvedValue({ role: 1 });

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 401 if user is not admin", async () => {
      req.user = { _id: "userId123" };
      userModel.findById.mockResolvedValue({ role: 0 });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UnAuthorized Access",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle user not found", async () => {
      req.user = { _id: "userId123" };
      userModel.findById.mockResolvedValue(null);

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: "User not found",
        message: "Error in admin middleware",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should log error and return 401 if findById throws", async () => {
      req.user = { _id: "userId123" };
      const error = new Error("DB error");
      userModel.findById.mockRejectedValue(error);

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await isAdmin(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error in admin middleware",
      });
      expect(next).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
