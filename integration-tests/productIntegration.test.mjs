// Goh En Rui Ryann A0252528A
// Product Integration Tests (CreateProduct & UpdateProduct)
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { userModel } from "../models/userModel.js";
import productModelRaw from "../models/productModel.js";
const productModel = productModelRaw.default || productModelRaw;
import categoryModelRaw from "../models/categoryModel.js";
const categoryModel = categoryModelRaw.default || categoryModelRaw;
import {
  createProductController,
  updateProductController,
  getProductController,
  getSingleProductController,
  deleteProductController,
} from "../controllers/productController.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { app } from "../server.js";
import JWT from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const mockFields = (fields) => {
  const mockReq = { fields: { ...fields }, files: {} };
  return mockReq;
};


describe("Product Integration Tests - Stage 1: Backend Controller + Database", () => {
  let testCategory;

  beforeEach(async () => {
    testCategory = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
  });

  test("createProductController creates a new product with all fields", async () => {
    const req = mockFields({
      name: "Laptop",
      description: "High-end laptop",
      price: "1299.99",
      category: testCategory._id.toString(),
      quantity: "5",
      shipping: "true",
    });

    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Created Successfully",
        products: expect.objectContaining({
          name: "Laptop",
          description: "High-end laptop",
          price: 1299.99,
          quantity: 5,
        }),
      })
    );

    const products = await productModel.find({});
    expect(products.length).toBe(1);
    expect(products[0].name).toBe("Laptop");
  });

  test("createProductController fails when name is missing", async () => {
    const req = mockFields({
      description: "Description",
      price: "100",
      category: testCategory._id.toString(),
      quantity: "5",
    });

    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createProductController fails when description is missing", async () => {
    const req = mockFields({
      name: "Product",
      price: "100",
      category: testCategory._id.toString(),
      quantity: "5",
    });

    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createProductController fails when price is missing", async () => {
    const req = mockFields({
      name: "Product",
      description: "Description",
      category: testCategory._id.toString(),
      quantity: "5",
    });

    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createProductController fails when category is missing", async () => {
    const req = mockFields({
      name: "Product",
      description: "Description",
      price: "100",
      quantity: "5",
    });

    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createProductController fails when quantity is missing", async () => {
    const req = mockFields({
      name: "Product",
      description: "Description",
      price: "100",
      category: testCategory._id.toString(),
    });

    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("updateProductController updates a product", async () => {
    const product = await productModel.create({
      name: "Old Laptop",
      slug: "old-laptop",
      description: "Old description",
      price: 999.99,
      category: testCategory._id,
      quantity: 3,
      shipping: true,
    });

    const req = mockFields({
      name: "New Laptop",
      description: "New description",
      price: "1299.99",
      category: testCategory._id.toString(),
      quantity: "10",
      shipping: "true",
    });
    req.params = { pid: product._id.toString() };

    const res = mockResponse();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.objectContaining({
          name: "New Laptop",
          description: "New description",
          price: 1299.99,
          quantity: 10,
        }),
      })
    );

    const updatedProduct = await productModel.findById(product._id);
    expect(updatedProduct.name).toBe("New Laptop");
    expect(updatedProduct.price).toBe(1299.99);
    expect(updatedProduct.quantity).toBe(10);
  });

  test("getProductController returns all products", async () => {
    await productModel.create([
      {
        name: "Laptop",
        slug: "laptop",
        description: "High-end laptop",
        price: 1299.99,
        category: testCategory._id,
        quantity: 5,
        shipping: true,
      },
      {
        name: "Smartphone",
        slug: "smartphone",
        description: "Latest smartphone",
        price: 799.99,
        category: testCategory._id,
        quantity: 10,
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
    expect(response.products.length).toBe(2);
  });

  test("getSingleProductController returns single product by slug", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "High-end laptop",
      price: 1299.99,
      category: testCategory._id,
      quantity: 5,
      shipping: true,
    });

    const req = { params: { slug: "laptop" } };
    const res = mockResponse();

    await getSingleProductController(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        product: expect.objectContaining({
          name: "Laptop",
          slug: "laptop",
        }),
      })
    );
  });

  test("deleteProductController deletes a product", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "High-end laptop",
      price: 1299.99,
      category: testCategory._id,
      quantity: 5,
      shipping: true,
    });

    const req = { params: { pid: product._id.toString() } };
    const res = mockResponse();

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Deleted successfully",
      })
    );

    const deletedProduct = await productModel.findById(product._id);
    expect(deletedProduct).toBeNull();
  });
});


describe("Product Integration Tests - Stage 2: API Route + Backend + Database", () => {
  let adminToken;
  let userToken;
  let testCategory;

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

    testCategory = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
  });

  test("POST /api/v1/product/create-product creates a new product", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "Laptop")
      .field("description", "High-end laptop")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "5")
      .field("shipping", "true");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.products.name).toBe("Laptop");
    expect(res.body.products.price).toBe(1299.99);
    expect(res.body.products.quantity).toBe(5);

    const products = await productModel.find({});
    expect(products.length).toBe(1);
  });

  test("POST /api/v1/product/create-product fails for missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "")
      .field("description", "Description");

    expect(res.status).toBe(500);
  });

  test("POST /api/v1/product/create-product denies non-admin access", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", userToken)
      .field("name", "Laptop")
      .field("description", "High-end laptop")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "5");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("PUT /api/v1/product/update-product/:pid updates a product", async () => {
    const product = await productModel.create({
      name: "Old Laptop",
      slug: "old-laptop",
      description: "Old description",
      price: 999.99,
      category: testCategory._id,
      quantity: 3,
      shipping: true,
    });

    const res = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", adminToken)
      .field("name", "New Laptop")
      .field("description", "New description")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "10")
      .field("shipping", "true");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.products.name).toBe("New Laptop");
    expect(res.body.products.price).toBe(1299.99);
    expect(res.body.products.quantity).toBe(10);

    const updatedProduct = await productModel.findById(product._id);
    expect(updatedProduct.name).toBe("New Laptop");
    expect(updatedProduct.price).toBe(1299.99);
  });

  test("PUT /api/v1/product/update-product/:pid handles non-existent product", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/product/update-product/${fakeId}`)
      .set("Authorization", adminToken)
      .field("name", "Laptop")
      .field("description", "Description")
      .field("price", "100")
      .field("category", testCategory._id.toString())
      .field("quantity", "5");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test("PUT /api/v1/product/update-product/:pid denies non-admin access", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Description",
      price: 999.99,
      category: testCategory._id,
      quantity: 3,
      shipping: true,
    });

    const res = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", userToken)
      .field("name", "New Laptop")
      .field("description", "New description")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "10");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/v1/product/get-product returns all products", async () => {
    await productModel.create([
      {
        name: "Laptop",
        slug: "laptop",
        description: "High-end laptop",
        price: 1299.99,
        category: testCategory._id,
        quantity: 5,
        shipping: true,
      },
      {
        name: "Smartphone",
        slug: "smartphone",
        description: "Latest smartphone",
        price: 799.99,
        category: testCategory._id,
        quantity: 10,
        shipping: true,
      },
    ]);

    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);
    expect(res.body.products[0].name).toBeDefined();
    expect(res.body.products[1].name).toBeDefined();
  });

  test("GET /api/v1/product/get-product returns product count", async () => {
    await productModel.create([
      { name: "Laptop", slug: "laptop", description: "Desc", price: 100, category: testCategory._id, quantity: 1 },
      { name: "Phone", slug: "phone", description: "Desc", price: 100, category: testCategory._id, quantity: 1 },
      { name: "Tablet", slug: "tablet", description: "Desc", price: 100, category: testCategory._id, quantity: 1 },
    ]);

    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBe(3);
    expect(res.body.counTotal).toBe(3);
  });

  test("GET /api/v1/product/get-product/:slug returns single product", async () => {
    await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "High-end laptop",
      price: 1299.99,
      category: testCategory._id,
      quantity: 5,
      shipping: true,
    });

    const res = await request(app).get("/api/v1/product/get-product/laptop");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe("Laptop");
    expect(res.body.product.slug).toBe("laptop");
    expect(res.body.product.price).toBe(1299.99);
  });

  test("GET /api/v1/product/get-product/:slug returns product when exists", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Description",
      price: 100,
      category: testCategory._id,
      quantity: 1,
    });

    const res = await request(app).get(`/api/v1/product/get-product/${product.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe("Laptop");
  });

  test("Product list updates after CRUD operations", async () => {
    // Create - verify list increases
    const createRes = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "Laptop")
      .field("description", "High-end laptop")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "5");
    expect(createRes.status).toBe(201);
    
    let listRes = await request(app).get("/api/v1/product/get-product");
    expect(listRes.body.products.length).toBe(1);
    expect(listRes.body.products[0].name).toBe("Laptop");

    // Update - verify list reflects change
    const productId = createRes.body.products._id;
    await request(app)
      .put(`/api/v1/product/update-product/${productId}`)
      .set("Authorization", adminToken)
      .field("name", "New Laptop")
      .field("description", "Updated")
      .field("price", "999")
      .field("category", testCategory._id.toString())
      .field("quantity", "10");
    
    listRes = await request(app).get("/api/v1/product/get-product");
    expect(listRes.body.products[0].name).toBe("New Laptop");
    expect(listRes.body.products[0].price).toBe(999);

    // Delete - verify list decreases
    await request(app)
      .delete(`/api/v1/product/delete-product/${productId}`)
      .set("Authorization", adminToken);
    
    listRes = await request(app).get("/api/v1/product/get-product");
    expect(listRes.body.products.length).toBe(0);
  });

  test("DELETE /api/v1/product/delete-product/:pid deletes a product", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Description",
      price: 999.99,
      category: testCategory._id,
      quantity: 3,
      shipping: true,
    });

    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${product._id}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Product Deleted successfully");

    const deletedProduct = await productModel.findById(product._id);
    expect(deletedProduct).toBeNull();
  });

  test("DELETE /api/v1/product/delete-product/:pid deletes product without auth", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Description",
      price: 999.99,
      category: testCategory._id,
      quantity: 3,
      shipping: true,
    });

    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deletedProduct = await productModel.findById(product._id);
    expect(deletedProduct).toBeNull();
  });
});


describe("Product Photo Upload Tests", () => {
  let adminToken;
  let testCategory;

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

    testCategory = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
  });

  afterEach(async () => {
    await userModel.deleteMany({});
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
  });

  test("POST /api/v1/product/create-product with photo uploads successfully", async () => {
    const testPhotoBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    ]);

    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "Laptop with Photo")
      .field("description", "High-end laptop with photo")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "5")
      .field("shipping", "true")
      .attach("photo", testPhotoBuffer, "test.png");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.products.name).toBe("Laptop with Photo");

    const product = await productModel.findById(res.body.products._id);
    expect(product.photo.data).toBeDefined();
    expect(product.photo.contentType).toBe("image/png");
  });

  test("POST /api/v1/product/create-product rejects photo over 1mb", async () => {
    const largeBuffer = Buffer.alloc(2000000, 'a');

    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "Laptop")
      .field("description", "Description")
      .field("price", "100")
      .field("category", testCategory._id.toString())
      .field("quantity", "5")
      .attach("photo", largeBuffer, "large.jpg");

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  test("PUT /api/v1/product/update-product/:pid with new photo updates photo", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Description",
      price: 999.99,
      category: testCategory._id,
      quantity: 3,
      shipping: true,
    });

    const testPhotoBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    ]);

    const res = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", adminToken)
      .field("name", "Laptop Updated")
      .field("description", "Updated description")
      .field("price", "1299.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "10")
      .attach("photo", testPhotoBuffer, "new-photo.jpg");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const updatedProduct = await productModel.findById(product._id);
    expect(updatedProduct.photo.data).toBeDefined();
    expect(updatedProduct.name).toBe("Laptop Updated");
  });
});
