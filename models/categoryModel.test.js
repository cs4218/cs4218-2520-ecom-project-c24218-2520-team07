import { describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import categoryModel from "./categoryModel.js";

describe("categoryModel", () => {
  test("creates a category with name and slug", () => {
    const category = new categoryModel({
      name: "Tech",
      slug: "tech",
    });

    expect(category.name).toBe("Tech");
    expect(category.slug).toBe("tech");
  });

  test("slug is lowercased when set", () => {
    const category = new categoryModel({
      name: "Electronics",
      slug: "ELECTRONICS",
    });

    expect(category.slug).toBe("electronics");
  });

  test("model can be instantiated with only name", () => {
    const category = new categoryModel({ name: "Gadgets" });

    expect(category.name).toBe("Gadgets");
    expect(category.slug).toBeUndefined();
  });

  test("validateSync passes for valid category", () => {
    const category = new categoryModel({
      name: "Books",
      slug: "books",
    });

    const error = category.validateSync();
    expect(error).toBeUndefined();
  });

  test("has expected schema paths", () => {
    const paths = Object.keys(categoryModel.schema.paths);
    expect(paths).toContain("name");
    expect(paths).toContain("slug");
    expect(paths).toContain("_id");
  });
});
