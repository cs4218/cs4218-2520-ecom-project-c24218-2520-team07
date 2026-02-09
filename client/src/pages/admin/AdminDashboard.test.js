import React from "react";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "./AdminDashboard";

// Mock Layout and AdminMenu so we can test without their implementation
jest.mock("./../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="mock-admin-menu" />
));

// Mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminDashboard Component", () => {
  const mockAuth = {
    user: {
      name: "John Admin",
      email: "admin@example.com",
      phone: "1234567890",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Layout and AdminMenu components", () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([mockAuth]);

    render(<AdminDashboard />);

    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
  });

  it("displays the admin information correctly", () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([mockAuth]);

    render(<AdminDashboard />);

    expect(screen.getByText(`Admin Name : ${mockAuth.user.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Admin Email : ${mockAuth.user.email}`)).toBeInTheDocument();
    expect(screen.getByText(`Admin Contact : ${mockAuth.user.phone}`)).toBeInTheDocument();
  });

  it("renders correctly with empty auth (no user)", () => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{}]); // auth is empty

    render(<AdminDashboard />);

    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });
});
