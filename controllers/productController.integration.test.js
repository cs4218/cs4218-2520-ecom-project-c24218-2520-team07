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

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import fs from "fs";
import {
  createProductController,
  getSingleProductController,
  productPhotoController,
  updateProductController,
  deleteProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
} from "./productController.js";

jest.mock("../models/productModel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../models/categoryModel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("slugify", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(() => Buffer.from("photo-data")),
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const mockQuery = (terminal, value) => {
  const q = {};
  ["populate", "select", "limit", "sort", "skip"].forEach((m) => {
    q[m] = jest.fn();
    if (m === terminal) q[m].mockResolvedValue(value);
    else q[m].mockReturnValue(q);
  });
  return q;
};

describe("productController Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    productModel.find = jest.fn();
    productModel.findOne = jest.fn();
    productModel.findById = jest.fn();
    productModel.findByIdAndUpdate = jest.fn();
    productModel.findByIdAndDelete = jest.fn();
    categoryModel.findOne = jest.fn();
    slugify.mockReturnValue("test-product");
  });

  describe("Create and Read Flow", () => {
    test("creates product with category reference successfully", async () => {
      const req = {
        fields: {
          name: "Laptop",
          description: "Gaming Laptop",
          price: 999,
          category: "cat1",
          quantity: 5,
          shipping: true,
        },
        files: { photo: null },
      };

      const res = mockRes();
      const newProduct = {
        _id: "p1",
        name: "Laptop",
        description: "Gaming Laptop",
        price: 999,
        category: "cat1",
        quantity: 5,
        slug: "test-product",
      };

      const save = jest.fn().mockResolvedValueOnce(newProduct);
      productModel.mockImplementationOnce(() => ({ save }));

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("retrieves product by slug with populated category", async () => {
      const newProduct = {
        _id: "p1",
        name: "Laptop",
        description: "Gaming Laptop",
        price: 999,
        category: "cat1",
        quantity: 5,
        slug: "test-product",
      };

      const getReq = { params: { slug: "test-product" } };
      const populated = { ...newProduct, category: { _id: "cat1", name: "Electronics" } };
      const q = mockQuery("populate", populated);
      productModel.findOne.mockReturnValueOnce(q);
      const res = mockRes();

      await getSingleProductController(getReq, res);

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "test-product" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Product CRUD Lifecycle", () => {
    test("creates product with all required fields", async () => {
      slugify.mockReturnValue("gaming-laptop");

      const createReq = {
        fields: {
          name: "Gaming Laptop",
          description: "High performance",
          price: 1200,
          category: "cat1",
          quantity: 3,
          shipping: true,
        },
        files: { photo: null },
      };

      const res = mockRes();
      const created = {
        _id: "p1",
        name: "Gaming Laptop",
        description: "High performance",
        price: 1200,
        category: "cat1",
        quantity: 3,
        slug: "gaming-laptop",
      };

      const save = jest.fn().mockResolvedValueOnce(created);
      productModel.mockImplementationOnce(() => ({ save }));

      await createProductController(createReq, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("retrieves product by slug", async () => {
      const created = {
        _id: "p1",
        name: "Gaming Laptop",
        description: "High performance",
        price: 1200,
        category: "cat1",
        quantity: 3,
        slug: "gaming-laptop",
      };

      const readReq = { params: { slug: "gaming-laptop" } };
      const q = mockQuery("populate", created);
      productModel.findOne.mockReturnValueOnce(q);
      const res = mockRes();

      await getSingleProductController(readReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("updates product with new details", async () => {
      slugify.mockReturnValue("gaming-laptop-pro");
      const updateReq = {
        params: { pid: "p1" },
        fields: {
          name: "Gaming Laptop Pro",
          description: "Ultra high performance",
          price: 1500,
          category: "cat1",
          quantity: 2,
          shipping: true,
        },
        files: { photo: null },
      };

      const res = mockRes();
      const updated = {
        _id: "p1",
        name: "Gaming Laptop Pro",
        description: "Ultra high performance",
        price: 1500,
        category: "cat1",
        quantity: 2,
        slug: "gaming-laptop-pro",
      };

      const updateSave = jest.fn().mockResolvedValueOnce(updated);
      productModel.findByIdAndUpdate.mockResolvedValueOnce({ ...updated, save: updateSave });

      await updateProductController(updateReq, res);

      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ name: "Gaming Laptop Pro" }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("deletes product from database", async () => {
      const res = mockRes();
      const deleteReq = { params: { pid: "p1" } };
      const updated = {
        _id: "p1",
        name: "Gaming Laptop Pro",
        description: "Ultra high performance",
        price: 1500,
        category: "cat1",
        quantity: 2,
        slug: "gaming-laptop-pro",
      };

      productModel.findByIdAndDelete.mockReturnValue({
        select: jest.fn().mockResolvedValue(updated),
      });

      await deleteProductController(deleteReq, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("p1");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Product Filtering with Categories", () => {
    test("filters products by multiple categories", async () => {
      const req = { body: { checked: ["cat1", "cat2"], radio: [] } };
      let res = mockRes();
      const filteredProducts = [
        {
          _id: "p1",
          name: "Product1",
          category: "cat1",
        },
        {
          _id: "p2",
          name: "Product2",
          category: "cat2",
        },
      ];

      productModel.find.mockResolvedValueOnce(filteredProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1", "cat2"],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: filteredProducts,
        })
      );
    });

    test("filters products by price range", async () => {
      const req = {
        body: {
          checked: [],
          radio: [100, 500],
        },
      };

      const res = mockRes();
      const filteredProducts = [
        { _id: "p1", name: "Product1", price: 250 },
        { _id: "p2", name: "Product2", price: 450 },
      ];

      productModel.find.mockResolvedValueOnce(filteredProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 100, $lte: 500 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("filters products by category AND price simultaneously", async () => {
      const req = {
        body: {
          checked: ["cat1"],
          radio: [100, 1000],
        },
      };

      const res = mockRes();
      const filteredProducts = [
        { _id: "p1", name: "Product1", category: "cat1", price: 500 },
      ];

      productModel.find.mockResolvedValueOnce(filteredProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1"],
        price: { $gte: 100, $lte: 1000 },
      });
    });
  });

  describe("Product Search and Discovery", () => {
    test("searches products by name and description", async () => {
      const req = { params: { keyword: "laptop" } };
      let res = mockRes();

      const searchResults = [
        { _id: "p1", name: "Gaming Laptop", description: "High-end laptop" },
        { _id: "p2", name: "Budget Laptop", description: "Affordable laptop" },
      ];

      productModel.find.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(searchResults),
      });

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "laptop", $options: "i" } },
          { description: { $regex: "laptop", $options: "i" } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(searchResults);
    });
  });

  describe("Product Listing and Pagination", () => {
    test("retrieves products with pagination", async () => {
      const req = { params: { page: 1 } };
      let res = mockRes();
      const products = [{ _id: "p1", name: "Product1" }, { _id: "p2", name: "Product2" }];
      const q = mockQuery("sort", products);
      productModel.find.mockReturnValueOnce(q);

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("retrieves total product count from database", async () => {
      const req = {};
      let res = mockRes();

      productModel.find.mockReturnValueOnce({
        estimatedDocumentCount: jest.fn().mockResolvedValueOnce(42),
      });

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          total: 42,
        })
      );
    });
  });

  describe("Related Products", () => {
    test("retrieves related products from same category", async () => {
      const req = { params: { pid: "p1", cid: "cat1" } };
      let res = mockRes();
      const related = [
        { _id: "p2", name: "Related Product 2", category: "cat1" },
        { _id: "p3", name: "Related Product 3", category: "cat1" },
      ];
      const q = mockQuery("populate", related);
      productModel.find.mockReturnValueOnce(q);

      await realtedProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: "cat1",
        _id: { $ne: "p1" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Product Photo Handling", () => {
    test("retrieves product photo with correct content type", async () => {
      const req = { params: { pid: "p1" } };
      let res = mockRes();
      const photoBuffer = Buffer.from("photo-data");
      const product = { photo: { data: photoBuffer, contentType: "image/jpeg" } };
      productModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(product),
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith("p1");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(photoBuffer);
    });
  });

  describe("Validation Integration", () => {
    test("validates all required fields before database operation", async () => {
      const incompleteReq = {
        fields: {
          name: "Incomplete Product",
          // missing description, price, etc.
        },
        files: { photo: null },
      };

      const res = mockRes();

      await createProductController(incompleteReq, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(productModel).not.toHaveBeenCalled();
    });

    test("validates photo size before saving", async () => {
      const req = {
        fields: {
          name: "Product",
          description: "Desc",
          price: 100,
          category: "cat1",
          quantity: 5,
        },
        files: {
          photo: {
            size: 2000000, // > 1MB
            path: "/tmp/large-photo.jpg",
            type: "image/jpeg",
          },
        },
      };

      const res = mockRes();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Database Error Handling", () => {
    test("handles database errors gracefully", async () => {
      const req = { params: { slug: "any-product" } };
      let res = mockRes();
      const dbError = new Error("Database connection failed");

      productModel.findOne.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValueOnce(dbError),
        }),
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Eror while getitng single product",
        })
      );
    });
  });
});
