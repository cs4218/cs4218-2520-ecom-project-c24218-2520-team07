import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import CartPage from "./CartPage";

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const axios = require("axios");
jest.mock("react-hot-toast");

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
  useCart: jest.fn(),
}));

const mockSetAuth = jest.fn();
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () =>
      React.createElement("div", {
        "data-testid": "payment-box",
        children: "Payment DropIn",
      }),
  };
});

jest.mock("react-icons/ai", () => ({
  AiFillWarning: () => null,
}));

describe("CartPage", () => {
  const stuffInCart = [
    {
      _id: "1",
      name: "Test Product",
      description: "A test product description for the cart",
      price: 29.99,
    },
    {
      _id: "2",
      name: "Another Product",
      description: "Another product in the cart",
      price: 49.99,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { useCart } = require("../context/cart");
    const { useAuth } = require("../context/auth");
    useCart.mockReturnValue([stuffInCart, mockSetCart]);
    useAuth.mockReturnValue([
      { user: null, token: "" },
      mockSetAuth,
    ]);

    axios.get.mockResolvedValue({
      data: { clientToken: "test-token-123" },
    });
    axios.post.mockResolvedValue({ data: { success: true } });

    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("has layout", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("says hello guest when not logged in", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
  });

  it("says hello with name when logged in", () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      { user: { name: "John" }, token: "auth-token" },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hello.*John/)).toBeInTheDocument();
  });

  it("shows how many items in cart", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/You Have 2 items in your cart/)).toBeInTheDocument();
  });

  it("tells guest to login for checkout", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/please login to checkout/)).toBeInTheDocument();
  });

  it("says cart is empty when theres nothing", () => {
    const { useCart } = require("../context/cart");
    useCart.mockReturnValue([[], mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  it("shows product names and prices", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Another Product")).toBeInTheDocument();
    expect(screen.getByText(/Price : 29.99/)).toBeInTheDocument();
    expect(screen.getByText(/Price : 49.99/)).toBeInTheDocument();
  });

  it("shows cart summary", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Cart Summary")).toBeInTheDocument();
    expect(screen.getByText("Total | Checkout | Payment")).toBeInTheDocument();
    expect(screen.getByText(/Total :/)).toBeInTheDocument();
  });

  it("remove button takes item out of cart", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const removeBtn = screen.getAllByText("Remove");
    fireEvent.click(removeBtn[0]);

    expect(mockSetCart).toHaveBeenCalledWith([stuffInCart[1]]);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([stuffInCart[1]])
    );
  });

  it("update address goes to profile when logged in", () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      { user: { name: "John" }, token: "auth-token" },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const addressBtn = screen.getAllByText("Update Address");
    fireEvent.click(addressBtn[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("login button goes to login page", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const loginBtn = screen.getByText("Plase Login to checkout");
    fireEvent.click(loginBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: "/cart",
    });
  });

  it("shows address when user has one", () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      {
        user: { name: "John", address: "123 Main St" },
        token: "auth-token",
      },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Current Address")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("gets braintree token when user is logged in", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      { user: { name: "John" }, token: "auth-token" },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/braintree/token"
      );
    });
  });

  it("shows payment stuff when logged in with address and items", async () => {
    const { useAuth } = require("../context/auth");
    useAuth.mockReturnValue([
      {
        user: { name: "John", address: "123 Main St" },
        token: "auth-token",
      },
      mockSetAuth,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("payment-box")).toBeInTheDocument();
    });

    expect(screen.getByText("Make Payment")).toBeInTheDocument();
  });

  it("total price is right", () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Total :/)).toHaveTextContent(/79\.98/);
  });
});
// Lynn, A0257099M