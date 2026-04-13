import JWT from "jsonwebtoken";
import { userModel } from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.startsWith("Bearer ") // Lin Bin A0258760W: Extract actual token
      ? authHeader.split(" ")[1]
      : authHeader;

    const decode = JWT.verify(
      token,
      process.env.JWT_SECRET,
    );
    req.user = decode;
    next();
  } catch (error) { // Lin Bin A0258760W: Add response for errors
    console.log("JWT error:", error);
    return res.status(401).send({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

//admin access
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);

    // Lin Bin A0258760W: Check if user exists
    if (!user) {
      return res.status(401).send({
        success: false,
        error: "User not found",
        message: "Error in admin middleware",
      });
    }
    if (user.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "UnAuthorized Access",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      error,
      message: "Error in admin middleware",
    });
  }
};
