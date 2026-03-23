// Cleon Tan De Xuan A0252030B
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetails from "../pages/ProductDetails";

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

const mockProduct = {
  _id: "prod1",
  name: "Test Laptop",
  description: "A powerful laptop for testing",
  price: 999.99,
  slug: "test-laptop",
  category: { _id: "cat1", name: "Electronics" },
};

const mockRelatedProducts = [
  {
    _id: "rel1",
    name: "Related Laptop",
    description:
      "A related laptop product with a much longer description that exceeds sixty characters total",
    price: 799.99,
    slug: "related-laptop",
  },
];

const renderProductDetails = (slug = "test-laptop") =>
  render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <Routes>
        <Route path="/product/:slug" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ProductDetails Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches product on mount and renders name, description, price, category", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product"))
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("related-product"))
        return Promise.resolve({ data: { products: [] } });
      return Promise.resolve({ data: {} });
    });

    renderProductDetails();

    await waitFor(() => {
      expect(screen.getByText(/Test Laptop/)).toBeInTheDocument();
      expect(
        screen.getByText(/A powerful laptop for testing/),
      ).toBeInTheDocument();
      expect(screen.getByText(/\$999\.99/)).toBeInTheDocument();
      expect(screen.getByText(/Electronics/)).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/test-laptop",
    );
  });

  it("calls related-product API with correct pid and cid after product loads", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product"))
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("related-product"))
        return Promise.resolve({ data: { products: [] } });
      return Promise.resolve({ data: {} });
    });

    renderProductDetails();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/prod1/cat1",
      );
    });
  });

  it("renders related product cards when related products are returned", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product"))
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("related-product"))
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      return Promise.resolve({ data: {} });
    });

    renderProductDetails();

    await waitFor(() => {
      expect(screen.getByText("Related Laptop")).toBeInTheDocument();
      expect(screen.getByText(/\$799\.99/)).toBeInTheDocument();
    });
  });

  it("shows No Similar Products when related products array is empty", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product"))
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("related-product"))
        return Promise.resolve({ data: { products: [] } });
      return Promise.resolve({ data: {} });
    });

    renderProductDetails();

    await waitFor(() => {
      expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
    });
  });

  it("truncates related product descriptions to 60 characters", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product"))
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("related-product"))
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      return Promise.resolve({ data: {} });
    });

    renderProductDetails();

    await waitFor(() => {
      const truncated = mockRelatedProducts[0].description.substring(0, 60);
      expect(screen.getByText(new RegExp(truncated))).toBeInTheDocument();
    });
  });

  it("re-fetches product when clicking More Details on a related product", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product"))
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("related-product"))
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      return Promise.resolve({ data: {} });
    });

    renderProductDetails();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "More Details" }),
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "More Details" }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/related-laptop",
      );
    });
  });

  it("handles get-product API error gracefully without crashing", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    renderProductDetails();

    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });
  });
});
