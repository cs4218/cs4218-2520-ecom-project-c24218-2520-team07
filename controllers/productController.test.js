// Goh En Rui Ryann A0252528A

import { jest } from "@jest/globals";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import slugify from "slugify";
import fs from "fs";
import braintree from "braintree";
import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  updateProductController,
  deleteProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} from "./productController.js";

jest.mock("../models/productModel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../models/categoryModel.js", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../models/orderModel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("slugify", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(() => Buffer.from("file")),
}));

jest.mock("braintree", () => {
  const mockGateway = {
    clientToken: { generate: jest.fn() },
    transaction: { sale: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      BraintreeGateway: jest.fn(() => mockGateway),
      Environment: { Sandbox: "Sandbox" },
      __mockGateway: mockGateway,
    },
  };
});

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const baseFields = {
  name: "Phone",
  description: "Smartphone",
  price: 499,
  category: "c1",
  quantity: 10,
  shipping: "1",
};

const basePhoto = {
  size: 500,
  path: "/tmp/photo.png",
  type: "image/png",
};

const createQuery = (terminalMethod, resolvedValue) => {
  const query = {};
  ["populate", "select", "limit", "sort", "skip"].forEach((method) => {
    if (method === terminalMethod) {
      query[method] = jest.fn().mockResolvedValue(resolvedValue);
    } else {
      query[method] = jest.fn().mockReturnValue(query);
    }
  });
  return query;
};

describe("productController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    productModel.find = jest.fn();
    productModel.findOne = jest.fn();
    productModel.findById = jest.fn();
    productModel.findByIdAndDelete = jest.fn();
    productModel.findByIdAndUpdate = jest.fn();
    categoryModel.findOne = jest.fn();
    slugify.mockReturnValue("slug-phone");
  });

  describe("createProductController", () => {
    test.each([
      ["name", "Name is Required"],
      ["description", "Description is Required"],
      ["price", "Price is Required"],
      ["category", "Category is Required"],
      ["quantity", "Quantity is Required"],
    ])("returns 500 when %s is missing", async (field, message) => {
      // Arrange
      const fields = { ...baseFields };
      delete fields[field];
      // Arrange
      const req = { fields, files: { photo: basePhoto } };
      const res = createRes();

      // Act

      await createProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0].error).toBe(message);
      // Assert
      expect(productModel).not.toHaveBeenCalled();
    });

    test("returns 500 when photo is too large", async () => {
      // Arrange
      const req = {
        fields: baseFields,
        files: { photo: { ...basePhoto, size: 1000001 } },
      };
      const res = createRes();

      // Act

      await createProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0].error).toBe(
        "photo is Required and should be less then 1mb"
      );
      // Assert
      expect(productModel).not.toHaveBeenCalled();
    });

    test("creates product with photo and returns success", async () => {
      const saveMock = jest.fn().mockResolvedValueOnce({});
      productModel.mockImplementationOnce(() => ({
        save: saveMock,
        photo: {},
      }));

      // Arrange

      const req = { fields: baseFields, files: { photo: basePhoto } };
      const res = createRes();

      // Act

      await createProductController(req, res);

      // Assert

      expect(slugify).toHaveBeenCalledWith("Phone");
      // Assert
      expect(productModel).toHaveBeenCalledWith({
        ...baseFields,
        slug: "slug-phone",
      });
      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/photo.png");
      // Assert
      expect(saveMock).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        message: "Product Created Successfully",
      });
    });

    test("creates product without photo", async () => {
      const saveMock = jest.fn().mockResolvedValueOnce({});
      productModel.mockImplementationOnce(() => ({
        save: saveMock,
        photo: {},
      }));

      // Arrange

      const req = { fields: baseFields, files: {} };
      const res = createRes();

      // Act

      await createProductController(req, res);

      // Assert

      expect(fs.readFileSync).not.toHaveBeenCalled();
      // Assert
      expect(saveMock).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("returns 500 on create error", async () => {
      const saveMock = jest.fn().mockRejectedValueOnce(new Error("db"));
      productModel.mockImplementationOnce(() => ({
        save: saveMock,
        photo: {},
      }));

      // Arrange

      const req = { fields: baseFields, files: { photo: basePhoto } };
      const res = createRes();

      // Act

      await createProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error in crearing product",
      });
    });
  });

  describe("updateProductController", () => {
    test.each([
      ["name", "Name is Required"],
      ["description", "Description is Required"],
      ["price", "Price is Required"],
      ["category", "Category is Required"],
      ["quantity", "Quantity is Required"],
    ])("returns 500 when %s is missing", async (field, message) => {
      // Arrange
      const fields = { ...baseFields };
      delete fields[field];
      // Arrange
      const req = { fields, files: { photo: basePhoto }, params: { pid: "p1" } };
      const res = createRes();

      // Act

      await updateProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0].error).toBe(message);
      // Assert
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("updates product and returns success", async () => {
      const saveMock = jest.fn().mockResolvedValueOnce({});
      const productInstance = { save: saveMock, photo: {} };
      productModel.findByIdAndUpdate.mockResolvedValueOnce(productInstance);

      // Arrange

      const req = {
        fields: baseFields,
        files: { photo: basePhoto },
        params: { pid: "p1" },
      };
      const res = createRes();

      // Act

      await updateProductController(req, res);

      // Assert

      expect(slugify).toHaveBeenCalledWith("Phone");
      // Assert
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "p1",
        { ...baseFields, slug: "slug-phone" },
        { new: true }
      );
      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/photo.png");
      // Assert
      expect(saveMock).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        message: "Product Updated Successfully",
      });
    });

    test("updates product without photo", async () => {
      const saveMock = jest.fn().mockResolvedValueOnce({});
      const productInstance = { save: saveMock, photo: {} };
      productModel.findByIdAndUpdate.mockResolvedValueOnce(productInstance);

      // Arrange

      const req = {
        fields: baseFields,
        files: {},
        params: { pid: "p1" },
      };
      const res = createRes();

      // Act

      await updateProductController(req, res);

      // Assert

      expect(fs.readFileSync).not.toHaveBeenCalled();
      // Assert
      expect(saveMock).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("returns 500 when photo is too large", async () => {
      // Arrange
      const req = {
        fields: baseFields,
        files: { photo: { ...basePhoto, size: 1000001 } },
        params: { pid: "p1" },
      };
      const res = createRes();

      // Act

      await updateProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0].error).toBe(
        "photo is Required and should be less then 1mb"
      );
      // Assert
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("returns 500 on update error", async () => {
      productModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("db"));

      // Arrange

      const req = {
        fields: baseFields,
        files: { photo: basePhoto },
        params: { pid: "p1" },
      };
      const res = createRes();

      // Act

      await updateProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error in Updte product",
      });
    });
  });

  describe("deleteProductController", () => {
    test("deletes product and returns success", async () => {
      productModel.findByIdAndDelete.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce({}),
      });
      // Arrange
      const req = { params: { pid: "p1" } };
      const res = createRes();

      // Act

      await deleteProductController(req, res);

      // Assert

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("p1");
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        message: "Product Deleted successfully",
      });
    });

    test("returns 500 on delete error", async () => {
      productModel.findByIdAndDelete.mockReturnValueOnce({
        select: jest.fn().mockRejectedValueOnce(new Error("db")),
      });
      // Arrange
      const req = { params: { pid: "p1" } };
      const res = createRes();

      // Act

      await deleteProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error while deleting product",
      });
    });
  });

  describe("getProductController", () => {
    test("returns products list", async () => {
      const products = [{ _id: "p1" }];
      const query = createQuery("sort", products);
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await getProductController(req, res);

      // Assert

      expect(productModel.find).toHaveBeenCalledWith({});
      // Assert
      expect(query.populate).toHaveBeenCalledWith("category");
      // Assert
      expect(query.select).toHaveBeenCalledWith("-photo");
      // Assert
      expect(query.limit).toHaveBeenCalledWith(12);
      // Assert
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        counTotal: 1,
        products,
      });
    });

    test("returns 500 on fetch error", async () => {
      const query = createQuery("sort", []);
      query.sort.mockRejectedValueOnce(new Error("db"));
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await getProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Erorr in getting products",
      });
    });
  });

  describe("getSingleProductController", () => {
    test("returns a single product", async () => {
      const product = { _id: "p1" };
      const query = createQuery("populate", product);
      productModel.findOne.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { slug: "phone" } };
      const res = createRes();

      // Act

      await getSingleProductController(req, res);

      // Assert

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "phone" });
      // Assert
      expect(query.select).toHaveBeenCalledWith("-photo");
      // Assert
      expect(query.populate).toHaveBeenCalledWith("category");
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        product,
      });
    });

    test("returns 500 on fetch error", async () => {
      const query = createQuery("populate", null);
      query.populate.mockRejectedValueOnce(new Error("db"));
      productModel.findOne.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { slug: "phone" } };
      const res = createRes();

      // Act

      await getSingleProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Eror while getitng single product",
      });
    });
  });

  describe("productPhotoController", () => {
    test("returns photo data when available", async () => {
      const product = {
        photo: { data: Buffer.from("img"), contentType: "image/png" },
      };
      const query = createQuery("select", product);
      productModel.findById.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { pid: "p1" } };
      const res = createRes();

      // Act

      await productPhotoController(req, res);

      // Assert

      expect(productModel.findById).toHaveBeenCalledWith("p1");
      // Assert
      expect(query.select).toHaveBeenCalledWith("photo");
      // Assert
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send).toHaveBeenCalledWith(product.photo.data);
    });

    test("does nothing when photo data is missing", async () => {
      const product = { photo: { data: null, contentType: "image/png" } };
      const query = createQuery("select", product);
      productModel.findById.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { pid: "p1" } };
      const res = createRes();

      // Act

      await productPhotoController(req, res);

      // Assert

      expect(res.status).not.toHaveBeenCalled();
      // Assert
      expect(res.send).not.toHaveBeenCalled();
    });

    test("returns 500 on photo error", async () => {
      const query = createQuery("select", null);
      query.select.mockRejectedValueOnce(new Error("db"));
      productModel.findById.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { pid: "p1" } };
      const res = createRes();

      // Act

      await productPhotoController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Erorr while getting photo",
      });
    });
  });

  describe("productFiltersController", () => {
    test("filters by category and price", async () => {
      const products = [{ _id: "p1" }];
      productModel.find.mockResolvedValueOnce(products);
      // Arrange
      const req = { body: { checked: ["c1"], radio: [10, 20] } };
      const res = createRes();

      // Act

      await productFiltersController(req, res);

      // Assert

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["c1"],
        price: { $gte: 10, $lte: 20 },
      });
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        products,
      });
    });

    test("returns 400 on filter error", async () => {
      productModel.find.mockRejectedValueOnce(new Error("db"));
      // Arrange
      const req = { body: { checked: [], radio: [] } };
      const res = createRes();

      // Act

      await productFiltersController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(400);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error WHile Filtering Products",
      });
    });
  });

  describe("productCountController", () => {
    test("returns total count", async () => {
      const query = { estimatedDocumentCount: jest.fn().mockResolvedValue(7) };
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await productCountController(req, res);

      // Assert

      expect(productModel.find).toHaveBeenCalledWith({});
      // Assert
      expect(query.estimatedDocumentCount).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        total: 7,
      });
    });

    test("returns 400 on count error", async () => {
      const query = {
        estimatedDocumentCount: jest.fn().mockRejectedValueOnce(new Error("db")),
      };
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await productCountController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(400);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error in product count",
      });
    });
  });

  describe("productListController", () => {
    test("returns paged products with default page", async () => {
      const products = [{ _id: "p1" }];
      const query = createQuery("sort", products);
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: {} };
      const res = createRes();

      // Act

      await productListController(req, res);

      // Assert

      expect(productModel.find).toHaveBeenCalledWith({});
      // Assert
      expect(query.select).toHaveBeenCalledWith("-photo");
      // Assert
      expect(query.skip).toHaveBeenCalledWith(0);
      // Assert
      expect(query.limit).toHaveBeenCalledWith(6);
      // Assert
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        products,
      });
    });

    test("returns paged products for specific page", async () => {
      const products = [{ _id: "p2" }];
      const query = createQuery("sort", products);
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { page: 2 } };
      const res = createRes();

      // Act

      await productListController(req, res);

      // Assert

      expect(query.skip).toHaveBeenCalledWith(6);
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 400 on page error", async () => {
      const query = createQuery("sort", []);
      query.sort.mockRejectedValueOnce(new Error("db"));
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { page: 1 } };
      const res = createRes();

      // Act

      await productListController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(400);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "error in per page ctrl",
      });
    });
  });

  describe("searchProductController", () => {
    test("returns search results", async () => {
      const results = [{ _id: "p1" }];
      const query = createQuery("select", results);
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { keyword: "phone" } };
      const res = createRes();

      // Act

      await searchProductController(req, res);

      // Assert

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "phone", $options: "i" } },
          { description: { $regex: "phone", $options: "i" } },
        ],
      });
      // Assert
      expect(query.select).toHaveBeenCalledWith("-photo");
      // Assert
      expect(res.json).toHaveBeenCalledWith(results);
    });

    test("returns 400 on search error", async () => {
      const query = createQuery("select", null);
      query.select.mockRejectedValueOnce(new Error("db"));
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { keyword: "phone" } };
      const res = createRes();

      // Act

      await searchProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(400);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error In Search Product API",
      });
    });
  });

  describe("realtedProductController", () => {
    test("returns related products", async () => {
      const products = [{ _id: "p2" }];
      const query = createQuery("populate", products);
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { pid: "p1", cid: "c1" } };
      const res = createRes();

      // Act

      await realtedProductController(req, res);

      // Assert

      expect(productModel.find).toHaveBeenCalledWith({
        category: "c1",
        _id: { $ne: "p1" },
      });
      // Assert
      expect(query.select).toHaveBeenCalledWith("-photo");
      // Assert
      expect(query.limit).toHaveBeenCalledWith(3);
      // Assert
      expect(query.populate).toHaveBeenCalledWith("category");
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        products,
      });
    });

    test("returns 400 on related error", async () => {
      const query = createQuery("populate", []);
      query.populate.mockRejectedValueOnce(new Error("db"));
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { pid: "p1", cid: "c1" } };
      const res = createRes();

      // Act

      await realtedProductController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(400);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "error while geting related product",
      });
    });
  });

  describe("productCategoryController", () => {
    test("returns products for category", async () => {
      const category = { _id: "c1" };
      const products = [{ _id: "p1" }];
      categoryModel.findOne.mockResolvedValueOnce(category);
      const query = createQuery("populate", products);
      productModel.find.mockReturnValueOnce(query);
      // Arrange
      const req = { params: { slug: "tech" } };
      const res = createRes();

      // Act

      await productCategoryController(req, res);

      // Assert

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "tech" });
      // Assert
      expect(productModel.find).toHaveBeenCalledWith({ category });
      // Assert
      expect(query.populate).toHaveBeenCalledWith("category");
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: true,
        category,
        products,
      });
    });

    test("returns 400 on category error", async () => {
      categoryModel.findOne.mockRejectedValueOnce(new Error("db"));
      // Arrange
      const req = { params: { slug: "tech" } };
      const res = createRes();

      // Act

      await productCategoryController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(400);
      // Assert
      expect(res.send.mock.calls[0][0]).toMatchObject({
        success: false,
        message: "Error While Getting products",
      });
    });
  });

  describe("braintreeTokenController", () => {
    test("returns token response on success", async () => {
      braintree.__mockGateway.clientToken.generate.mockImplementationOnce(
        (_, cb) => cb(null, { token: "abc" })
      );
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await braintreeTokenController(req, res);

      // Assert

      expect(braintree.__mockGateway.clientToken.generate).toHaveBeenCalledWith(
        {},
        expect.any(Function)
      );
      // Assert
      expect(res.send).toHaveBeenCalledWith({ token: "abc" });
    });

    test("returns 500 on token error", async () => {
      const err = new Error("token");
      braintree.__mockGateway.clientToken.generate.mockImplementationOnce(
        (_, cb) => cb(err)
      );
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await braintreeTokenController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send).toHaveBeenCalledWith(err);
    });

    test("logs error when gateway throws", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      braintree.__mockGateway.clientToken.generate.mockImplementationOnce(() => {
        throw new Error("boom");
      });
      // Arrange
      const req = {};
      const res = createRes();

      // Act

      await braintreeTokenController(req, res);

      // Assert

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("brainTreePaymentController", () => {
    test("creates order and returns ok on success", async () => {
      const orderSave = jest.fn();
      orderModel.mockImplementationOnce(() => ({ save: orderSave }));
      braintree.__mockGateway.transaction.sale.mockImplementationOnce(
        (payload, cb) => cb(null, { id: "t1" })
      );
      // Arrange
      const req = {
        body: {
          nonce: "nonce",
          cart: [{ price: 10 }, { price: 15 }],
        },
        user: { _id: "u1" },
      };
      const res = createRes();

      // Act

      await brainTreePaymentController(req, res);

      // Assert

      expect(braintree.__mockGateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          paymentMethodNonce: "nonce",
        }),
        expect.any(Function)
      );
      // Assert
      expect(orderModel).toHaveBeenCalledWith({
        products: req.body.cart,
        payment: { id: "t1" },
        buyer: "u1",
      });
      // Assert
      expect(orderSave).toHaveBeenCalledTimes(1);
      // Assert
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test("returns 500 on payment error", async () => {
      braintree.__mockGateway.transaction.sale.mockImplementationOnce(
        (_, cb) => cb(new Error("pay"))
      );
      // Arrange
      const req = { body: { nonce: "nonce", cart: [] }, user: { _id: "u1" } };
      const res = createRes();

      // Act

      await brainTreePaymentController(req, res);

      // Assert

      expect(res.status).toHaveBeenCalledWith(500);
      // Assert
      expect(res.send).toHaveBeenCalledWith(expect.any(Error));
    });

    test("logs error when payment throws", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      braintree.__mockGateway.transaction.sale.mockImplementationOnce(() => {
        throw new Error("boom");
      });
      // Arrange
      const req = { body: { nonce: "nonce", cart: [] }, user: { _id: "u1" } };
      const res = createRes();

      // Act

      await brainTreePaymentController(req, res);

      // Assert

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
