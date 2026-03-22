// Team Member Name, Student ID
// Integration tests for HomePage with useCategory hook and cart context

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock("../components/Prices", () => ({
  Prices: [
    { name: "$0 to 100", array: [0, 100] },
    { name: "$100 to 500", array: [100, 500] },
    { name: "$500 to 1000", array: [500, 1000] },
  ],
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => <div data-testid="reload-icon">Reload</div>,
}));

describe("HomePage Integration Tests", () => {
  const mockCategories = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Clothing", slug: "clothing" },
  ];

  const mockProducts = [
    {
      _id: "p1",
      name: "Laptop",
      price: 999,
      description: "High-end laptop",
      slug: "laptop",
      category: "1",
    },
    {
      _id: "p2",
      name: "Phone",
      price: 599,
      description: "Smartphone device",
      slug: "phone",
      category: "1",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { useCart } = require("../context/cart");
    useCart.mockReturnValue([[], jest.fn()]);

    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories, products: mockProducts, total: 2 },
    });
    axios.post.mockResolvedValue({
      data: { products: mockProducts },
    });

    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  test("fetches categories on mount and displays them in filter", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
    });
  });

  test("fetches total product count on mount", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });
  });

  test("filters products when category checkbox is selected", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/ });
    fireEvent.click(electronicsCheckbox);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
        checked: ["1"],
        radio: [],
      });
    });
  });

  test("filters products by price range", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("$0 to 100")).toBeInTheDocument();
    });

    const priceRadio = screen.getByRole("radio", { name: /\$100 to 500/ });
    fireEvent.click(priceRadio);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
        checked: [],
        radio: [100, 500],
      });
    });
  });

  test("applies multiple filters simultaneously", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/ });
    fireEvent.click(electronicsCheckbox);

    const priceRadio = screen.getByRole("radio", { name: /\$100 to 500/ });
    fireEvent.click(priceRadio);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
        checked: ["1"],
        radio: [100, 500],
      });
    });
  });

  test("reset filters button reloads page", async () => {
    delete window.location;
    window.location = { reload: jest.fn() };

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const resetButton = screen.getByRole("button", { name: /RESET FILTERS/ });
    fireEvent.click(resetButton);

    expect(window.location.reload).toHaveBeenCalled();
  });





  test("refetches all products when category filter is cleared", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    // First filter by category
    const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/ });
    fireEvent.click(electronicsCheckbox);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    // Then uncheck it
    fireEvent.click(electronicsCheckbox);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  test("has correct page title set", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "ALL Products - Best offers");
  });

  // ========== EDGE CASE TESTS ==========

  test("handles API error when fetching categories", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Page should still render without categories
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  test("handles API error when fetching products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-count")) {
        return Promise.reject(new Error("API Error"));
      }
      return Promise.resolve({
        data: { success: true, category: mockCategories, products: [], total: 0 },
      });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Page should render even with error
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  test("handles malformed filter response data", async () => {
    axios.post.mockResolvedValueOnce({
      data: { products: null }, // Null products
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/ });
    fireEvent.click(electronicsCheckbox);

    // Should handle gracefully
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test("handles empty category array from API", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-category")) {
        return Promise.resolve({
          data: { success: true, category: [] }, // Empty categories
        });
      }
      return Promise.resolve({
        data: { success: true, total: 2, products: mockProducts },
      });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Should render layout even with no categories
    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  test("handles products with zero price", async () => {
    const zeroProducts = [
      { ...mockProducts[0], price: 0, description: "Free item" },
      { ...mockProducts[1], price: 0, description: "Free item" },
    ];

    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories, products: zeroProducts, total: 2 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });

  test("handles products with negative prices", async () => {
    const negativePriceProducts = [
      { ...mockProducts[0], price: -100, description: "Discount" },
    ];

    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories, products: negativePriceProducts, total: 1 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });

  test("handles rapid filter clicks without race conditions", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/ });
    
    // Rapid clicks
    fireEvent.click(electronicsCheckbox);
    fireEvent.click(electronicsCheckbox);
    fireEvent.click(electronicsCheckbox);

    // Should handle sequence properly
    expect(axios.post).toHaveBeenCalled();
  });

  test("handles products with special characters in names", async () => {
    const specialCharProducts = [
      { ...mockProducts[0], name: 'Laptop "PRO" Edition' },
      { ...mockProducts[1], name: "Phone™ & Tablet®" },
    ];

    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories, products: specialCharProducts, total: 2 },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laptop "PRO" Edition')).toBeInTheDocument();
    });
  });

  test("handles extremely large product counts", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-count")) {
        return Promise.resolve({
          data: { success: true, total: 999999 },
        });
      }
      return Promise.resolve({
        data: { success: true, category: mockCategories, products: mockProducts, total: 999999 },
      });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  test("handles filter with both empty category and price arrays", async () => {
    axios.post.mockResolvedValueOnce({
      data: { products: [] }, // No products matching filters
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/ });
    fireEvent.click(electronicsCheckbox);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
        checked: ["1"],
        radio: [],
      });
    });
  });
});

// Low Han Lynn A0257099M
