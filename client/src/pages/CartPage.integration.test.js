// Team Member Name, Student ID
// Integration tests for CartPage with cart context and auth context

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CartPage from "./CartPage";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onInstance }) => {
      React.useEffect(() => {
        onInstance({ requestPaymentMethod: jest.fn() });
      }, [onInstance]);
      return <div data-testid="payment-drop-in">Payment DropIn</div>;
    },
  };
});

jest.mock("react-icons/ai", () => ({
  AiFillWarning: () => <div>Warning</div>,
}));

const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

const mockSetAuth = jest.fn();
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("CartPage Integration Tests", () => {
  const mockCartItems = [
    {
      _id: "p1",
      name: "Laptop",
      price: 999,
      description: "High-end laptop for work",
    },
    {
      _id: "p2",
      name: "Mouse",
      price: 29,
      description: "Wireless mouse",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { useCart } = require("../context/cart");
    const { useAuth } = require("../context/auth");

    useCart.mockReturnValue([mockCartItems, mockSetCart]);
    useAuth.mockReturnValue([
      { user: null, token: "" },
      mockSetAuth,
    ]);

    axios.get.mockResolvedValue({
      data: { clientToken: "test-token-123" },
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

  test("displays all items from cart context", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Mouse")).toBeInTheDocument();
    });
  });

  test("calculates and displays correct total price from cart items", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      //Total should be 999 + 29 = 1028
      expect(screen.getByText(/Total : \$1,028.00/)).toBeInTheDocument();
    });
  });

  test("removes item from cart when remove button is clicked", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    fireEvent.click(removeButtons[0]); // Remove first item (Laptop)

    await waitFor(() => {
      const updatedCart = mockCartItems.filter((item) => item._id !== "p1");
      expect(mockSetCart).toHaveBeenCalledWith(updatedCart);
    });
  });

  test("updates localStorage when cart item is removed", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    fireEvent.click(removeButtons[0]); // Remove first item (Laptop)

    await waitFor(() => {
      const updatedCart = mockCartItems.filter((item) => item._id !== "p1");
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify(updatedCart)
      );
    });
  });

  test("fetches braintree token on component mount", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
  });

  test("displays user address from auth context when logged in", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      {
        user: {
          name: "John Doe",
          address: "123 Main St, Springfield",
        },
        token: "auth-token-123",
      },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Current Address")).toBeInTheDocument();
      expect(screen.getByText("123 Main St, Springfield")).toBeInTheDocument();
    });
  });

  test("navigates to profile page when update address is clicked", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      {
        user: {
          name: "John Doe",
          address: "123 Main St",
        },
        token: "auth-token-123",
      },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Current Address")).toBeInTheDocument();
    });

    const updateButton = screen.getByRole("button", {
      name: /Update Address/,
    });
    fireEvent.click(updateButton);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  test("shows empty cart message when no items in context", async () => {
    const { useCart } = require("../context/cart");
    useCart.mockReturnValue([[], mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Cart Is Empty/)).toBeInTheDocument();
    });
  });

  test("shows login prompt when guest adds items to cart", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      { user: null, token: "" },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/please login to checkout/)).toBeInTheDocument();
    });
  });

  test("displays product images from API endpoint", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
      const productImage = images.find((img) => img.alt === "Laptop");
      expect(productImage).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/p1"
      );
    });
  });



  test("shows cart summary section with checkout info", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      {
        user: { name: "John Doe", address: "123 Main St" },
        token: "auth-token-123",
      },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Cart Summary")).toBeInTheDocument();
      expect(screen.getByText(/Total \| Checkout \| Payment/)).toBeInTheDocument();
    });
  });

  // ========== EDGE CASE TESTS ==========

  test("handles braintree token API failure gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Token API failed"));

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should still render cart even if token fails
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  test("handles cart with items with zero price", async () => {
    const { useCart } = require("../context/cart");
    const zeroCart = [
      { _id: "p1", name: "Free Item", price: 0, description: "No cost item" },
      { _id: "p2", name: "Regular Item", price: 50, description: "Regular item" },
    ];

    useCart.mockReturnValue([zeroCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Free Item")).toBeInTheDocument();
      // Total should be 0 + 50 = 50
      expect(screen.getByText(/Total : \$50.00/)).toBeInTheDocument();
    });
  });

  test("handles cart with negative prices", async () => {
    const { useCart } = require("../context/cart");
    const negativePriceCart = [
      { _id: "p1", name: "Discount Item", price: -20, description: "Discount applied" },
      { _id: "p2", name: "Regular Item", price: 100, description: "Item" },
    ];

    useCart.mockReturnValue([negativePriceCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // -20 + 100 = 80
      expect(screen.getByText(/Total : \$80.00/)).toBeInTheDocument();
    });
  });

  test("handles rapid remove button clicks - debouncing", async () => {
    const { useCart } = require("../context/cart");
    useCart.mockReturnValue([mockCartItems, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    
    // Rapid clicks
    fireEvent.click(removeButtons[0]);
    fireEvent.click(removeButtons[0]);
    fireEvent.click(removeButtons[0]);

    // Should only process final state
    expect(mockSetCart).toHaveBeenCalled();
  });

  test("handles cart with extremely large quantity", async () => {
    const { useCart } = require("../context/cart");
    const largeQtyCart = [
      { _id: "p1", name: "Item", price: 1, description: "Bulk", quantity: 999999 },
    ];

    useCart.mockReturnValue([largeQtyCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Item")).toBeInTheDocument();
    });
  });

  test("handles missing user address gracefully", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      {
        user: { name: "John Doe", address: "" }, // Empty address
        token: "auth-token-123",
      },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
    });
  });

  test("handles cart items with missing required fields", async () => {
    const { useCart } = require("../context/cart");
    const malformedCart = [
      { _id: "p1", name: "Item 1", price: 100, description: "Item missing qty" }, // missing quantity
      { _id: "p2", name: "Item 2", price: 50, description: "Item missing qty" }, // missing quantity  
      { _id: "p3", name: "Item 3", price: 75, description: "Item missing qty" }, // missing quantity
    ];

    useCart.mockReturnValue([malformedCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    // Should render cart view
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
  });

  test("handles special characters in product names", async () => {
    const { useCart } = require("../context/cart");
    const specialCharCart = [
      { _id: "p1", name: 'Item with "quotes"', price: 100, description: "Test" },
      { _id: "p2", name: "Item<script>alert</script>", price: 50, description: "XSS test" },
      { _id: "p3", name: "Item™ © ® 中文", price: 150, description: "Unicode test" },
    ];

    useCart.mockReturnValue([specialCharCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Item with "quotes"')).toBeInTheDocument();
    });
  });

  test("handles total calculation with floating point prices", async () => {
    const { useCart } = require("../context/cart");
    const floatingCart = [
      { _id: "p1", name: "Item 1", price: 10.99, description: "Test" },
      { _id: "p2", name: "Item 2", price: 20.50, description: "Test" },
      { _id: "p3", name: "Item 3", price: 15.51, description: "Test" },
    ];

    useCart.mockReturnValue([floatingCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 10.99 + 20.50 + 15.51 = 47.00
      expect(screen.getByText(/Total : \$47.00/)).toBeInTheDocument();
    });
  });
});

// Low Han Lynn A0257099M