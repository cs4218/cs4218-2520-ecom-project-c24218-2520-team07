import { describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("orderModel", () => {
  // Valid order creation
  test("creates an order with required fields", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: { transaction_id: "txn_123" },
    });

    expect(order.products).toHaveLength(1);
    expect(order.buyer).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(order.payment.transaction_id).toBe("txn_123");
  });

  test("creates an order with multiple products", () => {
    const productIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    const order = new orderModel({
      products: productIds,
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
    });

    expect(order.products).toHaveLength(3);
    expect(order.products[0]).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  // Default status value
  test("has default status of 'Not Process'", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
    });

    expect(order.status).toBe("Not Process");
  });

  // Status enum validation - equivalence partitioning
  test("accepts valid status 'Processing'", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
      status: "Processing",
    });

    expect(order.status).toBe("Processing");
  });

  test("accepts valid status 'Shipped'", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
      status: "Shipped",
    });

    expect(order.status).toBe("Shipped");
  });

  test("accepts valid status 'deliverd'", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
      status: "deliverd",
    });

    expect(order.status).toBe("deliverd");
  });

  test("accepts valid status 'cancel'", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
      status: "cancel",
    });

    expect(order.status).toBe("cancel");
  });

  // Boundary value analysis - empty products array
  test("accepts empty products array", () => {
    const order = new orderModel({
      products: [],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
    });

    expect(order.products).toHaveLength(0);
  });

  // Validation tests
  test("validateSync passes for valid order", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: { method: "card" },
      status: "Processing",
    });

    const error = order.validateSync();
    expect(error).toBeUndefined();
  });

  test("has expected schema paths", () => {
    const paths = Object.keys(orderModel.schema.paths);
    expect(paths).toContain("products");
    expect(paths).toContain("payment");
    expect(paths).toContain("buyer");
    expect(paths).toContain("status");
    expect(paths).toContain("_id");
  });

  test("has timestamps enabled", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
    });

    expect(order).toHaveProperty("createdAt");
    expect(order).toHaveProperty("updatedAt");
  });
});
// Cleon Tan De Xuan, A0252030B
