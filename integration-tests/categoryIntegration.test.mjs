// Category Integration Tests
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { userModel } from "../models/userModel.js";
import categoryModelRaw from "../models/categoryModel.js";
const categoryModel = categoryModelRaw.default || categoryModelRaw;
import {
  createCategoryController,
  updateCategoryController,
  categoryControlller,
  singleCategoryController,
  deleteCategoryCOntroller,
} from "../controllers/categoryController.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { app } from "../server.js";
import JWT from "jsonwebtoken";

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


describe("Category Integration Tests - Stage 1: Backend Controller + Database", () => {
  test("createCategoryController creates a new category", async () => {
    const req = { body: { name: "Electronics" } };
    const res = mockResponse();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "new category created",
        category: expect.objectContaining({
          name: "Electronics",
          slug: "electronics",
        }),
      })
    );

    const categories = await categoryModel.find({});
    expect(categories.length).toBe(1);
    expect(categories[0].name).toBe("Electronics");
  });

  test("createCategoryController fails for duplicate category", async () => {
    await categoryModel.create({ name: "Electronics", slug: "electronics" });

    const req = { body: { name: "Electronics" } };
    const res = mockResponse();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Category Already Exisits",
      })
    );
  });

  test("createCategoryController fails when name is missing", async () => {
    const req = { body: {} };
    const res = mockResponse();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("updateCategoryController updates a category", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const req = { params: { id: category._id }, body: { name: "Technology" } };
    const res = mockResponse();

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: expect.objectContaining({
          name: "Technology",
          slug: "technology",
        }),
      })
    );

    const updatedCategory = await categoryModel.findById(category._id);
    expect(updatedCategory.name).toBe("Technology");
    expect(updatedCategory.slug).toBe("technology");
  });

  test("categoryControlller returns all categories", async () => {
    await categoryModel.create([
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
      { name: "Books", slug: "books" },
    ]);

    const req = {};
    const res = mockResponse();

    await categoryControlller(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "All Categories List",
        category: expect.any(Array),
      })
    );
    const response = res.send.mock.calls[0][0];
    expect(response.category.length).toBe(3);
  });

  test("categoryControlller returns empty array when no categories", async () => {
    const req = {};
    const res = mockResponse();

    await categoryControlller(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: expect.any(Array),
      })
    );
    const response = res.send.mock.calls[0][0];
    expect(response.category.length).toBe(0);
  });

  test("singleCategoryController returns single category by slug", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const req = { params: { slug: "electronics" } };
    const res = mockResponse();

    await singleCategoryController(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Get SIngle Category SUccessfully",
        category: expect.objectContaining({
          name: "Electronics",
          slug: "electronics",
        }),
      })
    );
  });

  test("deleteCategoryCOntroller deletes a category", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const req = { params: { id: category._id } };
    const res = mockResponse();

    await deleteCategoryCOntroller(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Categry Deleted Successfully",
      })
    );

    const deletedCategory = await categoryModel.findById(category._id);
    expect(deletedCategory).toBeNull();
  });
});


describe("Category Integration Tests - Stage 2: API Route + Backend + Database", () => {
  let adminToken;
  let userToken;

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
  });

  test("POST /api/v1/category/create-category creates a new category", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Electronics");
    expect(res.body.category.slug).toBe("electronics");

    const categories = await categoryModel.find({});
    expect(categories.length).toBe(1);
  });

  test("POST /api/v1/category/create-category fails for duplicate category", async () => {
    await categoryModel.create({ name: "Electronics", slug: "electronics" });

    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Category Already Exisits");
  });

  test("POST /api/v1/category/create-category fails for empty name", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "" });

    expect(res.status).toBe(401);
  });

  test("POST /api/v1/category/create-category denies non-admin access", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", userToken)
      .send({ name: "Electronics" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("PUT /api/v1/category/update-category/:id updates a category", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const res = await request(app)
      .put(`/api/v1/category/update-category/${category._id}`)
      .set("Authorization", adminToken)
      .send({ name: "Technology" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Technology");
    expect(res.body.category.slug).toBe("technology");

    const updatedCategory = await categoryModel.findById(category._id);
    expect(updatedCategory.name).toBe("Technology");
  });

  test("PUT /api/v1/category/update-category/:id denies non-admin access", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const res = await request(app)
      .put(`/api/v1/category/update-category/${category._id}`)
      .set("Authorization", userToken)
      .send({ name: "Technology" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/v1/category/get-category returns all categories", async () => {
    await categoryModel.create([
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
    ]);

    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.category)).toBe(true);
    expect(res.body.category.length).toBe(2);
    expect(res.body.category[0].name).toBeDefined();
    expect(res.body.category[1].name).toBeDefined();
  });

  test("Category list updates after CRUD operations", async () => {
    // Create - verify list increases
    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });
    expect(createRes.status).toBe(201);
    
    let listRes = await request(app).get("/api/v1/category/get-category");
    expect(listRes.body.category.length).toBe(1);
    expect(listRes.body.category[0].name).toBe("Electronics");

    // Update - verify list reflects change
    const categoryId = createRes.body.category._id;
    await request(app)
      .put(`/api/v1/category/update-category/${categoryId}`)
      .set("Authorization", adminToken)
      .send({ name: "Technology" });
    
    listRes = await request(app).get("/api/v1/category/get-category");
    expect(listRes.body.category[0].name).toBe("Technology");

    // Delete - verify list decreases
    await request(app)
      .delete(`/api/v1/category/delete-category/${categoryId}`)
      .set("Authorization", adminToken);
    
    listRes = await request(app).get("/api/v1/category/get-category");
    expect(listRes.body.category.length).toBe(0);
  });

  test("GET /api/v1/category/get-category returns empty array when no categories", async () => {
    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.category)).toBe(true);
    expect(res.body.category.length).toBe(0);
  });

  test("GET /api/v1/category/single-category/:slug returns single category", async () => {
    await categoryModel.create({ name: "Electronics", slug: "electronics" });

    const res = await request(app).get("/api/v1/category/single-category/electronics");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Electronics");
    expect(res.body.category.slug).toBe("electronics");
  });

  test("DELETE /api/v1/category/delete-category/:id deletes a category", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${category._id}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Categry Deleted Successfully");

    const deletedCategory = await categoryModel.findById(category._id);
    expect(deletedCategory).toBeNull();
  });

  test("DELETE /api/v1/category/delete-category/:id denies non-admin access", async () => {
    const category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${category._id}`)
      .set("Authorization", userToken);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);

    const categoryStillExists = await categoryModel.findById(category._id);
    expect(categoryStillExists).not.toBeNull();
  });
});
