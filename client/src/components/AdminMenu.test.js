import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";

describe("AdminMenu", () => {
  // Output-based testing - verify rendered content
  it("displays Admin Panel heading", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("renders Create Category link", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const createCategoryLink = screen.getByText("Create Category");
    expect(createCategoryLink).toBeInTheDocument();
    expect(createCategoryLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category",
    );
  });

  it("renders Create Product link", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const createProductLink = screen.getByText("Create Product");
    expect(createProductLink).toBeInTheDocument();
    expect(createProductLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product",
    );
  });

  it("renders Products link", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const productsLink = screen.getByText("Products");
    expect(productsLink).toBeInTheDocument();
    expect(productsLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/products",
    );
  });

  it("renders Orders link", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const ordersLink = screen.getByText("Orders");
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/orders",
    );
  });

  // Structure validation
  it("renders all menu items in correct order", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveTextContent("Create Category");
    expect(links[1]).toHaveTextContent("Create Product");
    expect(links[2]).toHaveTextContent("Products");
    expect(links[3]).toHaveTextContent("Orders");
  });

  it("applies correct CSS classes to menu container", () => {
    const { container } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const menuDiv = container.querySelector(".list-group.dashboard-menu");
    expect(menuDiv).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
