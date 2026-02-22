// Lim Yih Fei A0256993J
import React from "react";
import { render, screen } from "@testing-library/react";
import Search from "./Search";
import { useSearch } from "../context/search";
import "@testing-library/jest-dom";

// Mocking dependencies
jest.mock("../context/search");
jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>{children}</div>
));

describe("Search Page Component", () => {
  const setValuesMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render product cards and handle truncated descriptions", () => {
    // Arrange
    const mockResults = [
      {
        _id: "1",
        name: "Product 1",
        description: "This is a long description for product 1", // Exactly 40 chars
        price: 100,
      },
      {
        _id: "2",
        name: "Product 2",
        description: "Short description",
        price: 200,
      },
    ];
    useSearch.mockReturnValue([{ results: mockResults }, setValuesMock]);

    // Act
    render(<Search />);

    // Assert
    
    // 1. Verify Headings (using regex to ignore case/typos)
    expect(screen.getByText(/search results/i)).toBeInTheDocument();
    expect(screen.getByText(/found 2/i)).toBeInTheDocument();

    // 2. Verify Product Names
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();

    // 3. Verify Truncation Logic
    // We expect 2 sets of dots because you have 2 products
    const ellipsisElements = screen.getAllByText(/\.\.\./);
    expect(ellipsisElements).toHaveLength(2);

    // Verify specifically that the truncated part of Product 1 is present
    const truncatedDesc = "This is a long description for".substring(0, 30);
    expect(screen.getByText(new RegExp(truncatedDesc))).toBeInTheDocument();

    // 4. Verify Prices and Buttons
    expect(screen.getByText("$ 100")).toBeInTheDocument();
    expect(screen.getByText("$ 200")).toBeInTheDocument();
    
    const moreDetailsBtns = screen.getAllByRole("button", { name: /more details/i });
    const addToCartBtns = screen.getAllByRole("button", { name: /add to cart/i });
    
    expect(moreDetailsBtns).toHaveLength(2);
    expect(addToCartBtns).toHaveLength(2);
  });

  test("should display 'No Products Found' when results are empty", () => {
    // Arrange
    useSearch.mockReturnValue([{ results: [] }, setValuesMock]);

    // Act
    render(<Search />);

    // Assert
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });
});