import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("Categories", () => {
  const categoryList = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Clothing", slug: "clothing" },
  ];

  beforeEach(() => {
    const useCategory = require("../hooks/useCategory").default;
    useCategory.mockReturnValue(categoryList);
  });

  it("has layout", () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("shows category names as links", () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();
  });

  it("links go to right category pages", () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const electronicsLink = screen.getByRole("link", { name: "Electronics" });
    const clothingLink = screen.getByRole("link", { name: "Clothing" });

    expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
    expect(clothingLink).toHaveAttribute("href", "/category/clothing");
  });

  it("shows nothing when no categories", () => {
    const useCategory = require("../hooks/useCategory").default;
    useCategory.mockReturnValue([]);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    expect(screen.queryByText("Clothing")).not.toBeInTheDocument();
  });
});
// Low Han, Lynn A0257099M
