import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import Orders from "./Orders";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

// Mocking dependencies
jest.mock("axios");
jest.mock("../../context/auth");
jest.mock("../../components/UserMenu", () => () => <div data-testid="user-menu" />);
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));

describe("Orders Component", () => {
  const mockOrders = [
    {
      _id: "1",
      status: "Not Processed",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: "p1",
          name: "Laptop",
          description: "High performance laptop",
          price: 1000,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render orders when auth token is present", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });

    // Act
    render(<Orders />);

    // Assert
    const header = await screen.findByText("All Orders");
    const productName = await screen.findByText("Laptop");
    
    expect(header).toBeInTheDocument();
    expect(productName).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  test("should not fetch orders if auth token is missing", async () => {
    // Arrange
    useAuth.mockReturnValue([{}, jest.fn()]); // No token

    // Act
    render(<Orders />);

    // Assert
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("should display 'Success' when payment is successful", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });

    // Act
    render(<Orders />);

    // Assert
    const paymentStatus = await screen.findByText("Success");
    expect(paymentStatus).toBeInTheDocument();
  });

  test("should display 'Failed' when payment is unsuccessful", async () => {
    // --- ARRANGE ---
    const mockUnsuccessfulOrder = [
      {
        _id: "2",
        status: "Cancelled",
        buyer: { name: "Jane Doe" },
        createAt: new Date().toISOString(),
        payment: { success: false }, // Logic branch: false
        products: [
          {
            _id: "p2",
            name: "Mouse",
            description: "Wireless mouse",
            price: 50,
          },
        ],
      },
    ];

    useAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockUnsuccessfulOrder });

    // --- ACT ---
    render(<Orders />);

    // --- ASSERT ---
    const paymentStatus = await screen.findByText("Failed");
    
    expect(paymentStatus).toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  test("should handle API error gracefully", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    useAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);
    axios.get.mockRejectedValue(new Error("API Error"));

    // Act
    render(<Orders />);

    // Assert
    await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});