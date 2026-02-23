import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CategoryProduct from "./CategoryProduct";
import axios from "axios";

jest.mock("axios");

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "electronics" }),
  useNavigate: () => mockNavigate,
}));

describe("CategoryProduct", () => {
  const mockCategory = {
    _id: "cat1",
    name: "Electronics",
    slug: "electronics",
  };

  const mockProducts = [
    {
      _id: "p1",
      name: "Laptop",
      description:
        "High performance laptop with great features and specifications for work",
      price: 1299.99,
      slug: "laptop",
    },
    {
      _id: "p2",
      name: "Smartphone",
      description:
        "Latest smartphone model with advanced camera and processing power",
      price: 899.99,
      slug: "smartphone",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { products: mockProducts, category: mockCategory },
    });
  });

  // Output-based testing
  it("displays category name in heading", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Category - Electronics/)).toBeInTheDocument();
    });
  });

  it("shows product count", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/2 result found/)).toBeInTheDocument();
    });
  });

  it("renders all products in category", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Smartphone")).toBeInTheDocument();
    });
  });

  it("displays product prices in USD format", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/\$1,299\.99/)).toBeInTheDocument();
      expect(screen.getByText(/\$899\.99/)).toBeInTheDocument();
    });
  });

  it("truncates product descriptions to 60 characters", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const laptopDesc = screen.getByText(/High performance laptop with great features and specificat/);
      expect(laptopDesc).toBeInTheDocument();
    });
  });

  // Communication-based testing
  it("fetches products by category on mount", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/electronics",
      );
    });
  });

  it("navigates to product details on More Details click", async () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const buttons = screen.getAllByText("More Details");
      buttons[0].click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
  });

  // Error handling
  it("handles API error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it("renders within Layout component", () => {
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
