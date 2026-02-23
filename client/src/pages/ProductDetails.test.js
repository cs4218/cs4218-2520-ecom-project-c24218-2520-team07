import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import axios from "axios";

jest.mock("axios");

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "test-product" }),
  useNavigate: () => mockNavigate,
}));

describe("ProductDetails", () => {
  const mockProduct = {
    _id: "prod1",
    name: "Test Product",
    description: "This is a test product description",
    price: 99.99,
    category: {
      _id: "cat1",
      name: "Electronics",
    },
  };

  const mockRelatedProducts = [
    {
      _id: "rel1",
      name: "Related Product 1",
      description:
        "Related product description that is longer than sixty characters for testing",
      price: 49.99,
      slug: "related-1",
    },
    {
      _id: "rel2",
      name: "Related Product 2",
      description:
        "Another related product with a long description for substring testing",
      price: 79.99,
      slug: "related-2",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("related-product")) {
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  // Output-based testing - verify rendered content
  it("renders product details correctly", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
      expect(
        screen.getByText(/This is a test product description/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Electronics/)).toBeInTheDocument();
    });
  });

  it("displays formatted price in USD currency", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
    });
  });

  it("renders product image with correct attributes", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const images = screen.getAllByRole("img");
      const mainImage = images[0];
      expect(mainImage).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod1",
      );
      expect(mainImage).toHaveAttribute("alt", "Test Product");
    });
  });

  // Communication-based testing - verify API calls
  it("fetches product data on mount", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-product",
      );
    });
  });

  it("fetches related products after product data loads", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/prod1/cat1",
      );
    });
  });

  // Related products section
  it("displays related products section", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Similar Products/)).toBeInTheDocument();
      expect(screen.getByText("Related Product 1")).toBeInTheDocument();
      expect(screen.getByText("Related Product 2")).toBeInTheDocument();
    });
  });

  it("shows message when no similar products found", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("related-product")) {
        return Promise.resolve({ data: { products: [] } });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
    });
  });

  it("truncates related product descriptions to 60 characters", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const description = screen.getByText(
        /Related product description that is longer than sixty charact/,
      );
      expect(description).toBeInTheDocument();
    });
  });

  it("navigates to related product details on button click", async () => {
    const { container } = render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const buttons = screen.getAllByText("More Details");
      buttons[0].click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/product/related-1");
  });

  // Error handling
  it("handles API error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("renders layout wrapper", async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
