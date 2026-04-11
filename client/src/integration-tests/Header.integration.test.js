// Cleon Tan De Xuan A0252030B
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Header from "../components/Header";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";

jest.mock("axios");
jest.mock("../context/search", () => ({
  useSearch: () => [{ keyword: "", results: [] }, jest.fn()],
}));
jest.mock("../components/Form/SearchInput", () => () => (
  <div data-testid="search-input" />
));

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

const renderHeader = () =>
  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );

describe("Header Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockResolvedValue({ data: { category: mockCategories } });
  });

  it("renders Login and Register links for guest user", async () => {
    renderHeader();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /register/i }),
      ).toBeInTheDocument();
    });
  });

  it("does not render Login and Register links when user is logged in", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Test User", role: 0 },
        token: "fake-token",
      }),
    );

    renderHeader();

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("link", { name: /^login$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /register/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Dashboard link to /dashboard/user for regular user", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Test User", role: 0 },
        token: "fake-token",
      }),
    );

    renderHeader();

    await waitFor(() => {
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
    });
  });

  it("shows Dashboard link to /dashboard/admin for admin user", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Admin User", role: 1 },
        token: "fake-token",
      }),
    );

    renderHeader();

    await waitFor(() => {
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
    });
  });

  it("fetches and displays categories in dropdown from API", async () => {
    renderHeader();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
    });
  });

  it("reflects cart item count from CartProvider via localStorage", async () => {
    const cartItems = [{ _id: "p1" }, { _id: "p2" }, { _id: "p3" }];
    localStorage.setItem("cart", JSON.stringify(cartItems));

    renderHeader();

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("clears auth state and shows Login/Register after logout", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Test User", role: 0 },
        token: "fake-token",
      }),
    );

    renderHeader();

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    const logoutLink = screen.getByRole("link", { name: /logout/i });
    await userEvent.click(logoutLink);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /register/i }),
      ).toBeInTheDocument();
    });

    expect(localStorage.getItem("auth")).toBeNull();
  });
});
