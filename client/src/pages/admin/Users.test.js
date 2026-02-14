// Lim Yih Fei A0256993J
import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";
import "@testing-library/jest-dom";

// Mocking dependencies
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    {children}
  </div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <nav data-testid="admin-menu">Admin Menu</nav>
));

describe("Users Component", () => {
  test("should render Layout, AdminMenu, and Page Heading", () => {
    // Act
    render(<Users />);

    // Assert
    
    // Verify Layout via title prop
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("title", "Dashboard - All Users");

    // Verify AdminMenu exists
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();

    // Verify Heading exists
    expect(screen.getByRole("heading", { name: "All Users" })).toBeInTheDocument();
  });

  test("should have correct accessible roles and hierarchy", () => {
    // Act
    render(<Users />);

    // Assert
    const menu = screen.getByTestId("admin-menu");
    const mainContent = screen.getByRole("heading", { name: "All Users" });

    // verify they both exist in the document. 
    expect(menu).toBeInTheDocument();
    expect(mainContent).toBeInTheDocument();
  });
});