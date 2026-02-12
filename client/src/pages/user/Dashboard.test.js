import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/UserMenu", () => () => <div>UserMenu</div>);

const mockUseAuth = jest.fn();

jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Dashboard", () => {
  test("renders user details", () => {
    // Arrange
    mockUseAuth.mockReturnValue([
      {
        user: {
          name: "Alice",
          email: "alice@example.com",
          address: "123 Road",
        },
      },
    ]);

    // Act
    render(<Dashboard />);

    // Assert
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("123 Road")).toBeInTheDocument();
  });
});
