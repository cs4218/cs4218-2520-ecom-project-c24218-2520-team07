// Goh En Rui Ryann A0252528A

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("./../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe("Products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders products on mount", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: "p1",
            slug: "phone",
            name: "Phone",
            description: "Smartphone",
          },
        ],
      },
    });

    // Act
    render(<Products />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    expect(await screen.findByText("Phone")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /phone/i });
    expect(link.getAttribute("href")).toBe("/dashboard/admin/product/phone");
  });

  test("shows error toast when fetch fails", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("fail"));

    // Act
    render(<Products />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
  });
});
