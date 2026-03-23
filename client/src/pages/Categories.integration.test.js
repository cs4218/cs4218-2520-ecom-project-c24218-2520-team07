// Team Member Name, Student ID
// Integration tests for Categories page with useCategory hook

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";
import axios from "axios";

jest.mock("axios");

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("Categories Integration Tests", () => {
  const mockCategories = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Clothing", slug: "clothing" },
    { _id: "3", name: "Books", slug: "books" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue(mockCategories);
  });

  test("calls useCategory hook on mount and displays categories", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(useCategory).toHaveBeenCalled();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  test("passes correct title to Layout component", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "All Categories");
  });

  test("creates links to category pages with correct slugs from hook data", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      const electronicsLink = screen.getByRole("link", { name: "Electronics" });
      const clothingLink = screen.getByRole("link", { name: "Clothing" });
      const booksLink = screen.getByRole("link", { name: "Books" });

      expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
      expect(clothingLink).toHaveAttribute("href", "/category/clothing");
      expect(booksLink).toHaveAttribute("href", "/category/books");
    });
  });

  test("handles empty categories from hook gracefully", async () => {
    useCategory.mockReturnValue([]);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(useCategory).toHaveBeenCalled();
      expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });
  });











  test("Layout component wraps all categories", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = screen.getByTestId("layout");

    await waitFor(() => {
      expect(layout).toContainElement(
        screen.getByRole("link", { name: "Electronics" })
      );
      expect(layout).toContainElement(
        screen.getByRole("link", { name: "Clothing" })
      );
    });
  });
});
