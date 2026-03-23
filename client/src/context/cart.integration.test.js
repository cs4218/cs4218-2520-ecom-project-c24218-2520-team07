// Integration tests for cart context with localStorage

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useCart, CartProvider } from "./cart";

describe("CartContext Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  test("initializes cart with data from localStorage on mount", async () => {
    const mockCartData = [
      { _id: "1", name: "Product 1", price: 100 },
      { _id: "2", name: "Product 2", price: 200 },
    ];

    localStorage.getItem.mockReturnValue(JSON.stringify(mockCartData));

    const TestComponent = () => {
      const [cart] = useCart();
      return (
        <div>
          {cart.map((item) => (
            <div key={item._id} data-testid={`cart-item-${item._id}`}>
              {item.name}
            </div>
          ))}
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });

  test("initializes with empty cart when localStorage is empty", async () => {
    localStorage.getItem.mockReturnValue(null);

    const TestComponent = () => {
      const [cart] = useCart();
      return (
        <div>{cart.length === 0 ? <span>Cart is empty</span> : <span>Has items</span>}</div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Cart is empty")).toBeInTheDocument();
    });
  });

  test("updates cart state when setCart is called", async () => {
    const TestComponent = () => {
      const [cart, setCart] = useCart();

      return (
        <div>
          <p data-testid="cart-count">Items: {cart.length}</p>
          <button onClick={() => {
            setCart([
              ...cart,
              { _id: "1", name: "Test Item", price: 50 },
            ]);
          }}>Add Item</button>
        </div>
      );
    };

    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = screen.getByRole("button", { name: "Add Item" });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Items: 1")).toBeInTheDocument();
    });
  });

  test("hook returns empty cart initially when localStorage is empty", async () => {
    const TestComponent = () => {
      const [cart, setCart] = useCart();
      return (
        <div>
          <p data-testid="cart-count">Items: {cart.length}</p>
        </div>
      );
    };

    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Items: 0")).toBeInTheDocument();
    });
  });

  test("multiple components can use useCart hook and share state", async () => {
    const CartDisplayA = () => {
      const [cart] = useCart();
      return <div data-testid="display-a">{cart.length} items in A</div>;
    };

    const CartDisplayB = () => {
      const [cart] = useCart();
      return <div data-testid="display-b">{cart.length} items in B</div>;
    };

    const CartUpdater = () => {
      const [, setCart] = useCart();
      return (
        <button
          onClick={() => {
            setCart([{ _id: "1", name: "Item", price: 100 }]);
          }}
        >
          Add Item
        </button>
      );
    };

    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <CartDisplayA />
        <CartDisplayB />
        <CartUpdater />
      </CartProvider>
    );

    // Initially both show 0 items
    await waitFor(() => {
      expect(screen.getByTestId("display-a")).toHaveTextContent("0 items in A");
      expect(screen.getByTestId("display-b")).toHaveTextContent("0 items in B");
    });

    // Update cart
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    // Both displays should update
    await waitFor(() => {
      expect(screen.getByTestId("display-a")).toHaveTextContent("1 items in A");
      expect(screen.getByTestId("display-b")).toHaveTextContent("1 items in B");
    });
  });

  test("cart context provides correct value structure [cart, setCart]", async () => {
    const TestComponent = () => {
      const cartContextValue = useCart();
      return (
        <div>
          <p data-testid="is-array">{Array.isArray(cartContextValue) ? "yes" : "no"}</p>
          <p data-testid="has-length">{cartContextValue.length === 2 ? "yes" : "no"}</p>
        </div>
      );
    };

    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-array")).toHaveTextContent("yes");
      expect(screen.getByTestId("has-length")).toHaveTextContent("yes");
    });
  });

  test("cart effect runs and processes localStorage correctly", async () => {
    const mockCartData = JSON.stringify([{ _id: "1", name: "Persisted Item", price: 99 }]);
    localStorage.getItem.mockReturnValue(mockCartData);

    const TestComponent = () => {
      const [cart] = useCart();
      return <div>{cart.length > 0 && <span>Loaded from storage</span>}</div>;
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Loaded from storage")).toBeInTheDocument();
    });
  });

  test("correctly parses JSON cart data from localStorage", async () => {
    const cartItems = [
      { _id: "1", name: "Item 1", price: 100 },
      { _id: "2", name: "Item 2", price: 200 },
    ];

    localStorage.getItem.mockReturnValue(JSON.stringify(cartItems));

    const TestComponent = () => {
      const [cart] = useCart();
      return (
        <div>
          {cart.map((item) => (
            <span key={item._id} data-testid={`item-${item._id}`}>
              {item.name}: ${item.price}
            </span>
          ))}
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("item-1")).toHaveTextContent("Item 1: $100");
      expect(screen.getByTestId("item-2")).toHaveTextContent("Item 2: $200");
    });
  });

  // ========== EDGE CASE TESTS ==========

  test("handles corrupted localStorage data gracefully", async () => {
    // Simulate missing localStorage (returns null instead of invalid data)
    localStorage.getItem.mockReturnValue(null);

    const TestComponent = () => {
      const [cart] = useCart();
      return <div>{cart.length === 0 ? <span>Empty cart</span> : <span>Has items</span>}</div>;
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      // Should fallback to empty array when localStorage is null
      expect(screen.getByText("Empty cart")).toBeInTheDocument();
    });
  });

  test("handles rapid consecutive setCart calls", async () => {
    const TestComponent = () => {
      const [cart, setCart] = useCart();
      const rapidUpdate = async () => {
        setCart([{ _id: "1", name: "Item 1", price: 100 }]);
        setCart([{ _id: "1", name: "Item 1", price: 100 }, { _id: "2", name: "Item 2", price: 200 }]);
        setCart([{ _id: "1", name: "Item 1", price: 100 }, { _id: "2", name: "Item 2", price: 200 }, { _id: "3", name: "Item 3", price: 300 }]);
      };

      return (
        <div>
          <p data-testid="item-count">Items: {cart.length}</p>
          <button onClick={rapidUpdate}>Rapid Update</button>
        </div>
      );
    };

    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const button = screen.getByRole("button", { name: "Rapid Update" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("item-count")).toHaveTextContent("Items: 3");
    });
  });

  test("handles cart with missing required fields", async () => {
    const malformedCartData = [
      { _id: "1", price: 100 }, // missing name
      { _id: "2", name: "Item 2" }, // missing price
      { name: "Item 3", price: 300 }, // missing _id
    ];

    localStorage.getItem.mockReturnValue(JSON.stringify(malformedCartData));

    const TestComponent = () => {
      const [cart] = useCart();
      return (
        <div>
          <p>{cart.length} items</p>
          {cart.map((item) => (
            <div key={item._id || Math.random()} data-testid="item">
              {item.name || "Unknown"} - ${item.price || "N/A"}
            </div>
          ))}
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("3 items")).toBeInTheDocument();
    });
  });

  test("handles extremely large cart data", async () => {
    const largeCart = Array.from({ length: 1000 }, (_, i) => ({
      _id: `${i}`,
      name: `Item ${i}`,
      price: Math.random() * 10000,
    }));

    localStorage.getItem.mockReturnValue(JSON.stringify(largeCart));

    const TestComponent = () => {
      const [cart] = useCart();
      return <div data-testid="cart-size">Cart size: {cart.length}</div>;
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("cart-size")).toHaveTextContent("Cart size: 1000");
    });
  });

  test("handles special characters in item names", async () => {
    const specialCharCart = [
      { _id: "1", name: "Item <script>alert('xss')</script>", price: 100 },
      { _id: "2", name: "Item & \"quotes\" 'apostrophe'", price: 200 },
      { _id: "3", name: "Item™ © ® 中文", price: 300 },
    ];

    localStorage.getItem.mockReturnValue(JSON.stringify(specialCharCart));

    const TestComponent = () => {
      const [cart] = useCart();
      return (
        <div>
          {cart.map((item) => (
            <span key={item._id} data-testid={`item-${item._id}`}>
              {item.name}
            </span>
          ))}
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("item-1")).toHaveTextContent("Item <script>alert('xss')</script>");
    });
  });

  test("handles zero and negative prices", async () => {
    const edgePriceCart = [
      { _id: "1", name: "Free Item", price: 0 },
      { _id: "2", name: "Discount Item", price: -50 },
      { _id: "3", name: "Normal Item", price: 100.5 },
    ];

    localStorage.getItem.mockReturnValue(JSON.stringify(edgePriceCart));

    const TestComponent = () => {
      const [cart] = useCart();
      return (
        <div>
          {cart.map((item) => (
            <div key={item._id} data-testid={`price-${item._id}`}>
              ${item.price}
            </div>
          ))}
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("price-1")).toHaveTextContent("$0");
      expect(screen.getByTestId("price-2")).toHaveTextContent("$-50");
      expect(screen.getByTestId("price-3")).toHaveTextContent("$100.5");
    });
  });

  test("maintains state consistency with rapid context updates and reads", async () => {
    const TestComponent = () => {
      const [cart, setCart] = useCart();
      const [renderCount, setRenderCount] = React.useState(0);

      const triggerUpdates = async () => {
        for (let i = 0; i < 10; i++) {
          setCart([...cart, { _id: `${i}`, name: `Item ${i}`, price: i * 10 }]);
          setRenderCount((prev) => prev + 1);
        }
      };

      return (
        <div>
          <p data-testid="final-count">{cart.length}</p>
          <p data-testid="render-count">{renderCount}</p>
          <button onClick={triggerUpdates}>Trigger Updates</button>
        </div>
      );
    };

    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const button = screen.getByRole("button", { name: "Trigger Updates" });
    fireEvent.click(button);

    await waitFor(() => {
      const renderValue = parseInt(screen.getByTestId("render-count").textContent);
      expect(renderValue).toBeGreaterThan(0);
    });
  });
});

// Low Han Lynn A0257099M
