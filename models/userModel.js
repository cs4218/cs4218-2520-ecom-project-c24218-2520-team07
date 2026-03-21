import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: {},
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Lin Bin A0258760W
// Using a named export (`export const userModel`) instead of `export default`
// allows us to import the model consistently across tests and avoids issues
// with destructuring in ESM. This ensures that when we do `import { userModel } from "./userModel.js"`,
// we get the actual Mongoose model constructor and can create instances correctly.
export const userModel = mongoose.model("User", userSchema);