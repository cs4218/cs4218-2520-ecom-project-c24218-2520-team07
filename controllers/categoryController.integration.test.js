// Team Member Name, Student ID
// Integration tests for categoryController with categoryModel

import { jest } from "@jest/globals";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import {
  createCategoryController,
  updateCategoryController,
  categoryControlller,
  singleCategoryController,
  deleteCategoryCOntroller,
} from "./categoryController.js";

jest.mock("../models/categoryModel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("slugify", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("categoryController Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    categoryModel.find = jest.fn();
    categoryModel.findOne = jest.fn();
    categoryModel.findByIdAndUpdate = jest.fn();
    categoryModel.findByIdAndDelete = jest.fn();
    slugify.mockReturnValue("electronics");
  });

  describe("Create and Retrieve Flow", () => {
    test("creates a category successfully", async () => {
      const req = { body: { name: "Electronics" } };
      const res = createRes();
      const newCategory = { _id: "1", name: "Electronics", slug: "electronics" };
      const saveMock = jest.fn().mockResolvedValueOnce(newCategory);

      categoryModel.findOne.mockResolvedValueOnce(null);
      categoryModel.mockImplementationOnce(() => ({ save: saveMock }));

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("retrieves category by slug from database", async () => {
      const existingCategory = { _id: "1", name: "Electronics", slug: "electronics" };
      categoryModel.findOne.mockResolvedValueOnce(existingCategory);
      const getRes = createRes();
      const getReq = { params: { slug: "electronics" } };

      await singleCategoryController(getReq, getRes);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
      expect(getRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Category CRUD Integration", () => {
    test("creates category and returns correct response structure", async () => {
      const categoryData = { name: "Books" };
      slugify.mockReturnValue("books");

      const createReq = { body: categoryData };
      const createResObj = createRes();
      const createdCategory = { _id: "cat1", name: "Books", slug: "books" };
      const saveMock = jest.fn().mockResolvedValueOnce(createdCategory);

      categoryModel.findOne.mockResolvedValueOnce(null);
      categoryModel.mockImplementationOnce(() => ({ save: saveMock }));

      await createCategoryController(createReq, createResObj);

      expect(createResObj.status).toHaveBeenCalledWith(201);
      expect(createResObj.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: createdCategory,
      });
    });

    test("updates category with new name and slug", async () => {
      const updateReq = {
        body: { name: "Books & Media" },
        params: { id: "cat1" },
      };
      const updateResObj = createRes();
      slugify.mockReturnValue("books-media");
      const updatedCategory = {
        _id: "cat1",
        name: "Books & Media",
        slug: "books-media",
      };

      categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updatedCategory);

      await updateCategoryController(updateReq, updateResObj);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "cat1",
        { name: "Books & Media", slug: "books-media" },
        { new: true }
      );
      expect(updateResObj.status).toHaveBeenCalledWith(200);
    });

    test("retrieves updated category after modification", async () => {
      const updatedCategory = {
        _id: "cat1",
        name: "Books & Media",
        slug: "books-media",
      };
      const getResObj = createRes();
      const getReq = { params: { slug: "books-media" } };

      categoryModel.findOne.mockResolvedValueOnce(updatedCategory);

      await singleCategoryController(getReq, getResObj);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "books-media" });
      expect(getResObj.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Category Filtering and Search", () => {
    test("fetches multiple categories from database", async () => {
      const categories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
        { _id: "2", name: "Clothing", slug: "clothing" },
        { _id: "3", name: "Books", slug: "books" },
      ];

      categoryModel.find.mockResolvedValueOnce(categories);

      const req = {};
      const res = createRes();

      await categoryControlller(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: categories,
      });
    });
  });

  describe("Category Validation Flow", () => {
    test("checks for existing category before creating new one", async () => {
      const req = { body: { name: "Electronics" } };
      const res = createRes();

      // First check - category exists
      categoryModel.findOne.mockResolvedValueOnce({ _id: "1", name: "Electronics" });

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
    });

    test("validates required name field before database operations", async () => {
      const req = { body: {} };
      const res = createRes();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        message: "Name is required",
      });
    });
  });

  describe("Category Slug Generation", () => {
    test("generates slug from category name consistently", async () => {
      const req = { body: { name: "Home & Garden" } };
      const res = createRes();

      slugify.mockReturnValue("home-garden");
      const newCategory = {
        _id: "1",
        name: "Home & Garden",
        slug: "home-garden",
      };
      const saveMock = jest.fn().mockResolvedValueOnce(newCategory);

      categoryModel.findOne.mockResolvedValueOnce(null);
      categoryModel.mockImplementationOnce(() => ({ save: saveMock }));

      await createCategoryController(req, res);

      expect(slugify).toHaveBeenCalledWith("Home & Garden");
      expect(saveMock).toHaveBeenCalledWith();
    });
  });

  describe("Category Deletion", () => {
    test("deletes category from database", async () => {
      const req = { params: { id: "cat1" } };
      const res = createRes();

      categoryModel.findByIdAndDelete.mockResolvedValueOnce({
        _id: "cat1",
        name: "Electronics",
      });

      await deleteCategoryCOntroller(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("cat1");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Database Error Handling", () => {
    test("handles database error when fetching all categories", async () => {
      const dbError = new Error("Database connection failed");
      categoryModel.find.mockRejectedValueOnce(dbError);
      const req = {};
      const res = createRes();

      await categoryControlller(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("handles database error when updating category", async () => {
      categoryModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("Update failed"));
      const req = { body: { name: "Updated" }, params: { id: "cat1" } };
      const res = createRes();

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Response Structure", () => {
    test("returns consistent response structure for successful operations", async () => {
      const categories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
      ];

      categoryModel.find.mockResolvedValueOnce(categories);

      const req = {};
      const res = createRes();

      await categoryControlller(req, res);

      const callArgs = res.send.mock.calls[0][0];
      expect(callArgs).toHaveProperty("success", true);
      expect(callArgs).toHaveProperty("message");
      expect(callArgs).toHaveProperty("category");
    });
  });
});
// Low Han Lynn A0257099M
