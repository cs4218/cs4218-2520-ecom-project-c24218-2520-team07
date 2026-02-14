// Lim Yih Fei A0256993J
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

// Mocking dependencies
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth");
jest.mock("../../components/UserMenu", () => () => <div data-testid="user-menu" />);
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));

describe("Profile Component", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    phone: "123456789",
    address: "123 Main St",
  };

  const setAuthMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup initial auth context
    useAuth.mockReturnValue([{ user: mockUser }, setAuthMock]);
    
    // Mock LocalStorage
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({ user: mockUser }));
    Storage.prototype.setItem = jest.fn();
  });

  test("should populate form with existing user data on mount", () => {
    // Arrange
    // (Handled in beforeEach)

    // Act
    render(<Profile />);

    // Assert
    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe(mockUser.name);
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(mockUser.email);
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(mockUser.phone);
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe(mockUser.address);
  });

test("should update profile successfully and update local storage", async () => {
    // Arrange
    const updatedUser = { ...mockUser, name: "Jane Doe" };
    axios.put.mockResolvedValue({
      data: { updatedUser },
    });

    render(<Profile />);
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    const updateButton = screen.getByText("UPDATE");

    // Act
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    fireEvent.click(updateButton);

    // Assert
    
    // 1. Wait specifically for the primary side effect (the API call)
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile", 
        expect.objectContaining({ name: "Jane Doe" })
      );
    });

    // 2. Synchronous assertions (now that the async gate is open)
    expect(setAuthMock).toHaveBeenCalled();
    expect(localStorage.setItem).toBeCalled();
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
  });

  test("should show error toast when API returns an error property", async () => {
    // Arrange
    axios.put.mockResolvedValue({
      data: { errro: true, error: "Email is already taken" }, // Note: testing 'errro' typo in your source code
    });

    // Act
    render(<Profile />);
    fireEvent.click(screen.getByText("UPDATE"));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email is already taken");
    });
  });

  test("should show generic error toast when request fails", async () => {
    // Arrange
    axios.put.mockRejectedValue(new Error("Network Error"));

    // Act
    render(<Profile />);
    fireEvent.click(screen.getByText("UPDATE"));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("should render the UI structure correctly", () => {
    // ARRANGE is handled in beforeEach
    
    // ACT
    render(<Profile />);

    // ASSERT - Covering the container, row, and layout structure 
    expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    
    // Asserting types and classes to cover attribute rendering
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    expect(nameInput).toHaveClass("form-control");
    expect(nameInput).toHaveAttribute("type", "text");
    
    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    expect(emailInput).toBeDisabled(); // Covers the 'disabled' attribute on Line 105
  });

  test("should update all input fields correctly on user change", () => {
    // Arrange
    // Covers remaining statements and functions
    render(<Profile />);
    
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    const passwordInput = screen.getByPlaceholderText("Enter Your Password");
    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    const addressInput = screen.getByPlaceholderText("Enter Your Address");

    // Act
    // This executes the anonymous functions/setters for every line in your JSX
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    fireEvent.change(emailInput, { target: { value: "jane@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "newPassword123" } });
    fireEvent.change(phoneInput, { target: { value: "987654321" } });
    fireEvent.change(addressInput, { target: { value: "456 New Ave" } });

    // Assert
    expect(nameInput.value).toBe("Jane Doe");
    expect(emailInput.value).toBe("jane@example.com");
    expect(passwordInput.value).toBe("newPassword123");
    expect(phoneInput.value).toBe("987654321");
    expect(addressInput.value).toBe("456 New Ave");
  });

});