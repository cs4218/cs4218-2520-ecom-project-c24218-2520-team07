// Goh En Rui Ryann A0252528A

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

describe("categoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    categoryModel.find = jest.fn();
    categoryModel.findOne = jest.fn();
    categoryModel.findByIdAndUpdate = jest.fn();
    categoryModel.findByIdAndDelete = jest.fn();
    slugify.mockReturnValue("tech");
  });

  describe("createCategoryController", () => {
    test("returns 401 when name is missing", async () => {
      // Arrange
      const req = { body: {} };
      const res = createRes();

      // Act

      await createCategoryController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(401);
      // Assert
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
      // Assert
      expect(categoryModel.findOne).not.toHaveBeenCalled();
    });

    test("returns existing category when name already exists", async () => {
      // Arrange
      const req = { body: { name: "Tech" } };
      const res = createRes();
      categoryModel.findOne.mockResolvedValueOnce({ _id: "1" });

      // Act

      await createCategoryController(req, res);

      // Assert

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Tech" });
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
    });

    test("creates a new category when not existing", async () => {
      // Arrange
      const req = { body: { name: "Tech" } };
      const res = createRes();
      const savedCategory = { _id: "1", name: "Tech", slug: "tech" };
      const saveMock = jest.fn().mockResolvedValueOnce(savedCategory);

      categoryModel.findOne.mockResolvedValueOnce(null);
      categoryModel.mockImplementationOnce(() => ({ save: saveMock }));

      // Act

      await createCategoryController(req, res);

      // Assert

      expect(slugify).toHaveBeenCalledWith("Tech");
      // Assert
      expect(categoryModel).toHaveBeenCalledWith({
        name: "Tech",
        slug: "tech",
      });
      // Assert
      expect(saveMock).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: savedCategory,
      });
    });

    test("throws due to errro typo in catch block", async () => {
      // Arrange
      const req = { body: { name: "Tech" } };
      const res = createRes();
      categoryModel.findOne.mockRejectedValueOnce(new Error("db"));

      await expect(createCategoryController(req, res)).rejects.toThrow(
        ReferenceError
      );
    });
  });

  describe("updateCategoryController", () => {
    test("updates category and returns updated doc", async () => {
      // Arrange
      const req = { body: { name: "Gadgets" }, params: { id: "1" } };
      const res = createRes();
      const updatedCategory = { _id: "1", name: "Gadgets" };
      categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updatedCategory);

      // Act

      await updateCategoryController(req, res);

      // Assert

      expect(slugify).toHaveBeenCalledWith("Gadgets");
      // Assert
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        { name: "Gadgets", slug: "tech" },
        { new: true }
      );
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: updatedCategory,
      });
    });

    test("returns 500 on update error", async () => {
      // Arrange
      const req = { body: { name: "Gadgets" }, params: { id: "1" } };
      const res = createRes();
      const error = new Error("db");
      categoryModel.findByIdAndUpdate.mockRejectedValueOnce(error);

      // Act

      await updateCategoryController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error while updating category",
      });
    });
  });

  describe("deleteCategoryCOntroller", () => {
    test("deletes category and returns success", async () => {
      // Arrange
      const req = { params: { id: "1" } };
      const res = createRes();
      categoryModel.findByIdAndDelete.mockResolvedValueOnce({});

      await deleteCategoryCOntroller(req, res);

      // Assert

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });

    test("returns 500 on delete error", async () => {
      // Arrange
      const req = { params: { id: "1" } };
      const res = createRes();
      const error = new Error("db");
      categoryModel.findByIdAndDelete.mockRejectedValueOnce(error);

      await deleteCategoryCOntroller(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while deleting category",
        error,
      });
    });
  });

  describe("categoryControlller", () => {
    test("returns all categories", async () => {
      const categories = [{ _id: "1", name: "Tech" }];
      categoryModel.find.mockResolvedValueOnce(categories);
      // Arrange
      const req = {};
      const res = createRes();

      await categoryControlller(req, res);

      // Assert

      expect(categoryModel.find).toHaveBeenCalledWith({});
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: categories,
      });
    });

    test("returns 500 on fetch error", async () => {
      const error = new Error("db");
      categoryModel.find.mockRejectedValueOnce(error);
      // Arrange
      const req = {};
      const res = createRes();

      await categoryControlller(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error while getting all categories",
      });
    });
  });

  describe("singleCategoryController", () => {
    test("returns single category", async () => {
      const category = { _id: "1", slug: "tech" };
      categoryModel.findOne.mockResolvedValueOnce(category);
      // Arrange
      const req = { params: { slug: "tech" } };
      const res = createRes();

      // Act

      await singleCategoryController(req, res);

      // Assert

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "tech" });
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get SIngle Category SUccessfully",
        category,
      });
    });

    test("returns 500 on single category error", async () => {
      const error = new Error("db");
      categoryModel.findOne.mockRejectedValueOnce(error);
      // Arrange
      const req = { params: { slug: "tech" } };
      const res = createRes();

      // Act

      await singleCategoryController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error While getting Single Category",
      });
    });
  });
});
