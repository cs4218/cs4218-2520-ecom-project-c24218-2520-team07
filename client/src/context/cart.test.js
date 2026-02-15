import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

function TestChild() {
  const [cart, setCart] = useCart();
  return (
    <div>
      <span data-testid="cart-length">{cart?.length ?? 0}</span>
      <span data-testid="cart-items">{JSON.stringify(cart)}</span>
      <button
        onClick={() => setCart([...cart, { id: "1", name: "thing" }])}
        data-testid="add-btn"
      >
        add
      </button>
    </div>
  );
}

describe("cart context", () => {
  it("starts with empty cart", () => {
    Object.defineProperty(window, "localStorage", {
      value: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
      writable: true,
    });
    render(
      <CartProvider>
        <TestChild />
      </CartProvider>
    );

    expect(screen.getByTestId("cart-length")).toHaveTextContent("0");
    expect(screen.getByTestId("cart-items")).toHaveTextContent("[]");
  });

  it("loads cart from localStorage on mount", async () => {
    const savedCart = [{ _id: "1", name: "saved item", price: 10 }];
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify(savedCart)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    render(
      <CartProvider>
        <TestChild />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("cart-length")).toHaveTextContent("1");
    });

    expect(screen.getByTestId("cart-items")).toHaveTextContent("saved item");
  });

  it("add button updates cart", () => {
    Object.defineProperty(window, "localStorage", {
      value: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
      writable: true,
    });

    render(
      <CartProvider>
        <TestChild />
      </CartProvider>
    );

    expect(screen.getByTestId("cart-length")).toHaveTextContent("0");

    fireEvent.click(screen.getByTestId("add-btn"));

    expect(screen.getByTestId("cart-length")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-items")).toHaveTextContent("thing");
  });
});
// Lynn, A0257099M
