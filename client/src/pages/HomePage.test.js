import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import HomePage from "./HomePage";

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const axios = require("axios");
jest.mock("react-hot-toast");

jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => null,
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: () => [[], mockSetCart],
}));

describe("HomePage", () => {
  const products = [
    {
      _id: "1",
      name: "Test Product 1",
      slug: "test-product-1",
      description: "A short description of test product one for testing",
      price: 29.99,
    },
    {
      _id: "2",
      name: "Test Product 2",
      slug: "test-product-2",
      description: "Another product description that is longer than sixty chars",
      price: 49.99,
    },
  ];

  const categories = [
    { _id: "cat1", name: "Electronics" },
    { _id: "cat2", name: "Clothing" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("get-category")) {
        return Promise.resolve({
          data: { success: true, category: categories },
        });
      }
      if (url.includes("product-count")) {
        return Promise.resolve({ data: { total: 5 } });
      }
      if (url.includes("product-list")) {
        return Promise.resolve({ data: { products } });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
    axios.post.mockResolvedValue({
      data: { products },
    });
  });

  it("has layout", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  it("shows banner", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const img = screen.getByAltText("bannerimage");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/images/Virtual.png");
    });
  });

  it("has filter sections", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
    });
  });

  it("shows all products heading", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
  });

  it("loads and shows categories", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
    });
  });

  it("loads and shows products", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-list/1"
      );
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });
  });

  it("more details goes to product page", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    const detailsBtn = screen.getAllByText("More Details");
    fireEvent.click(detailsBtn[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/product/test-product-1");
  });

  it("add to cart puts item in cart and shows toast", async () => {
    const storage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: storage,
      writable: true,
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    const addBtn = screen.getAllByText("ADD TO CART");
    fireEvent.click(addBtn[0]);

    expect(mockSetCart).toHaveBeenCalledWith([products[0]]);
    expect(storage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([products[0]])
    );
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("shows load more when theres more products", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    const loadBtn = screen.getByRole("button", { name: /loadmore/i });
    expect(loadBtn).toBeInTheDocument();
  });

  it("load more fetches more products", async () => {
    const moreProducts = [
      {
        _id: "3",
        name: "Product 3",
        slug: "product-3",
        description: "Third product description",
        price: 79.99,
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes("product-list/2")) {
        return Promise.resolve({ data: { products: moreProducts } });
      }
      if (url.includes("product-list/1")) {
        return Promise.resolve({ data: { products } });
      }
      if (url.includes("get-category")) {
        return Promise.resolve({
          data: { success: true, category: categories },
        });
      }
      if (url.includes("product-count")) {
        return Promise.resolve({ data: { total: 5 } });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    const loadBtn = screen.getByRole("button", { name: /loadmore/i });
    fireEvent.click(loadBtn);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-list/2"
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Product 3")).toBeInTheDocument();
    });
  });

  it("shows prices in dollars", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("$29.99")).toBeInTheDocument();
      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });
  });

  it("reset filters reloads page", async () => {
    const fakeReload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: fakeReload },
      writable: true,
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("RESET FILTERS"));

    expect(fakeReload).toHaveBeenCalled();
  });
});
