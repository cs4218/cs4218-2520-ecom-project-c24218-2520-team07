import { describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import productModel from "./productModel.js";

describe("productModel", () => {
  // Valid product creation
  test("creates a product with all required fields", () => {
    const product = new productModel({
      name: "iPhone 15",
      slug: "iphone-15",
      description: "Latest Apple smartphone",
      price: 999,
      category: new mongoose.Types.ObjectId(),
      quantity: 50,
    });

    expect(product.name).toBe("iPhone 15");
    expect(product.slug).toBe("iphone-15");
    expect(product.description).toBe("Latest Apple smartphone");
    expect(product.price).toBe(999);
    expect(product.quantity).toBe(50);
  });

  test("creates a product with optional photo field", () => {
    const product = new productModel({
      name: "Laptop",
      slug: "laptop",
      description: "Gaming laptop",
      price: 1299,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      photo: {
        data: Buffer.from("test"),
        contentType: "image/jpeg",
      },
    });

    expect(product.photo.data).toBeInstanceOf(Buffer);
    expect(product.photo.contentType).toBe("image/jpeg");
  });

  test("creates a product with optional shipping field", () => {
    const product = new productModel({
      name: "Keyboard",
      slug: "keyboard",
      description: "Mechanical keyboard",
      price: 99,
      category: new mongoose.Types.ObjectId(),
      quantity: 100,
      shipping: true,
    });

    expect(product.shipping).toBe(true);
  });

  // Boundary value analysis - price boundaries
  test("accepts minimum valid price of 0", () => {
    const product = new productModel({
      name: "Free Sample",
      slug: "free-sample",
      description: "Free product sample",
      price: 0,
      category: new mongoose.Types.ObjectId(),
      quantity: 1,
    });

    expect(product.price).toBe(0);
  });

  test("accepts large price values", () => {
    const product = new productModel({
      name: "Luxury Car",
      slug: "luxury-car",
      description: "Expensive luxury vehicle",
      price: 999999.99,
      category: new mongoose.Types.ObjectId(),
      quantity: 1,
    });

    expect(product.price).toBe(999999.99);
  });

  // Boundary value analysis - quantity boundaries
  test("accepts minimum valid quantity of 0", () => {
    const product = new productModel({
      name: "Out of Stock Item",
      slug: "out-of-stock",
      description: "Currently unavailable",
      price: 50,
      category: new mongoose.Types.ObjectId(),
      quantity: 0,
    });

    expect(product.quantity).toBe(0);
  });

  test("accepts large quantity values", () => {
    const product = new productModel({
      name: "Wholesale Item",
      slug: "wholesale-item",
      description: "Bulk available",
      price: 5,
      category: new mongoose.Types.ObjectId(),
      quantity: 100000,
    });

    expect(product.quantity).toBe(100000);
  });

  // Validation tests
  test("validateSync passes for valid product with all fields", () => {
    const product = new productModel({
      name: "Mouse",
      slug: "mouse",
      description: "Wireless mouse",
      price: 29.99,
      category: new mongoose.Types.ObjectId(),
      quantity: 200,
      shipping: false,
    });

    const error = product.validateSync();
    expect(error).toBeUndefined();
  });

  test("has expected schema paths", () => {
    const paths = Object.keys(productModel.schema.paths);
    expect(paths).toContain("name");
    expect(paths).toContain("slug");
    expect(paths).toContain("description");
    expect(paths).toContain("price");
    expect(paths).toContain("category");
    expect(paths).toContain("quantity");
    expect(paths).toContain("photo.data");
    expect(paths).toContain("photo.contentType");
    expect(paths).toContain("shipping");
    expect(paths).toContain("_id");
  });

  test("has timestamps enabled", () => {
    const product = new productModel({
      name: "Test",
      slug: "test",
      description: "Test product",
      price: 10,
      category: new mongoose.Types.ObjectId(),
      quantity: 5,
    });

    expect(product).toHaveProperty("createdAt");
    expect(product).toHaveProperty("updatedAt");
  });
});
// Cleon Tan De Xuan, A0252030B
