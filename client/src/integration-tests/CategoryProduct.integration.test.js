// Cleon Tan De Xuan A0252030B
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CategoryProduct from "../pages/CategoryProduct";

jest.mock("axios");
jest.mock("../context/cart", () => ({ useCart: () => [[], jest.fn()] }));
jest.mock("../context/search", () => ({
  useSearch: () => [{ keyword: "", results: [] }, jest.fn()],
}));
jest.mock("../context/auth", () => ({
  useAuth: () => [{ user: null, token: "" }, jest.fn()],
}));
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockCategory = { _id: "cat1", name: "Electronics", slug: "electronics" };

const mockProducts = [
  {
    _id: "prod1",
    name: "Laptop",
    description:
      "A high-performance laptop for developers and professionals needing power",
    price: 1299.99,
    slug: "laptop",
  },
  {
    _id: "prod2",
    name: "Smartphone",
    description:
      "A flagship smartphone with an incredible camera system and long battery life",
    price: 899.99,
    slug: "smartphone",
  },
];

const renderCategoryProduct = (slug = "electronics") =>
  render(
    <MemoryRouter initialEntries={[`/category/${slug}`]}>
      <Routes>
        <Route path="/category/:slug" element={<CategoryProduct />} />
        <Route
          path="/product/:slug"
          element={<div data-testid="product-page">Product Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("CategoryProduct Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches products on mount and renders category name and result count", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts, category: mockCategory },
    });

    renderCategoryProduct();

    await waitFor(() => {
      expect(screen.getByText("Category - Electronics")).toBeInTheDocument();
      expect(screen.getByText("2 result found")).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/electronics",
    );
  });

  it("renders product cards with name and price for each product", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts, category: mockCategory },
    });

    renderCategoryProduct();

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Smartphone")).toBeInTheDocument();
      expect(screen.getByText("$1,299.99")).toBeInTheDocument();
      expect(screen.getByText("$899.99")).toBeInTheDocument();
    });
  });

  it("shows 0 result found when category has no products", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [], category: mockCategory },
    });

    renderCategoryProduct();

    await waitFor(() => {
      expect(screen.getByText("0 result found")).toBeInTheDocument();
    });
  });

  it("truncates product descriptions to 60 characters", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts, category: mockCategory },
    });

    renderCategoryProduct();

    await waitFor(() => {
      const truncated = mockProducts[0].description.substring(0, 60);
      expect(screen.getByText(new RegExp(truncated))).toBeInTheDocument();
    });
  });

  it("uses slug from URL params to call the correct API endpoint", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [],
        category: { _id: "cat2", name: "Clothing", slug: "clothing" },
      },
    });

    renderCategoryProduct("clothing");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/clothing",
      );
    });
  });

  it("navigates to product details page when More Details is clicked", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts, category: mockCategory },
    });

    renderCategoryProduct();

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "More Details" }),
      ).toHaveLength(2);
    });

    const [firstBtn] = screen.getAllByRole("button", { name: "More Details" });
    await userEvent.click(firstBtn);

    await waitFor(() => {
      expect(screen.getByTestId("product-page")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully without crashing", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    renderCategoryProduct();

    await waitFor(() => {
      expect(
        screen.queryByText("Category - Electronics"),
      ).not.toBeInTheDocument();
    });
  });
});
