// Goh En Rui Ryann A0252528A

import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import ForgotPassword from "./ForgotPassword";
import userEvent from "@testing-library/user-event";

// Mock axios and toast
jest.mock("axios");
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
  Toaster: () => <div data-testid="mock-toaster" />,
}));
jest.mock("../../components/Header", () => () => (
  <div data-testid="mock-header" />
));

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the forgot password form", () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    expect(getByText("FORGOT PASSWORD")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(
      getByPlaceholderText("Enter Your Security Answer"),
    ).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your New Password")).toBeInTheDocument();
    expect(getByText("RESET PASSWORD")).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    expect(getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(getByPlaceholderText("Enter Your Security Answer").value).toBe("");
    expect(getByPlaceholderText("Enter Your New Password").value).toBe("");
  });

  it("should allow typing in all input fields", () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Security Answer"), {
      target: { value: "MyAnswer" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: "newPass123" },
    });

    expect(getByPlaceholderText("Enter Your Email").value).toBe(
      "test@example.com",
    );
    expect(getByPlaceholderText("Enter Your Security Answer").value).toBe(
      "MyAnswer",
    );
    expect(getByPlaceholderText("Enter Your New Password").value).toBe(
      "newPass123",
    );
  });

  it("should call forgot-password API with correct data", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Password Reset Successfully" },
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Security Answer"), {
      target: { value: "MyAnswer" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: "newPass123" },
    });

    // Act
    fireEvent.click(getByText("RESET PASSWORD"));

    // Assert
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
        email: "test@example.com",
        answer: "MyAnswer",
        newPassword: "newPass123",
      }),
    );
  });

  it("should show success toast when password reset is successful", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Password Reset Successfully" },
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Security Answer"), {
      target: { value: "MyAnswer" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: "newPass123" },
    });

    // Act
    fireEvent.click(getByText("RESET PASSWORD"));

    // Assert
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Password Reset Successfully",
        expect.any(Object),
      ),
    );
  });

  it("should show fallback success message when API returns no message", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Enter Your Security Answer"),
      { target: { value: "answer" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("RESET PASSWORD"));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Password reset successfully!",
        expect.any(Object),
      ),
    );
  });

  it("should show error toast if API fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Security Answer"), {
      target: { value: "MyAnswer" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: "newPass123" },
    });

    fireEvent.click(getByText("RESET PASSWORD"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
  });

  it("should show error toast for wrong email or answer", async () => {
    // Mock axios.post to return 404 error like backend
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Wrong Email Or Answer" },
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    const answerInput = screen.getByPlaceholderText(
      "Enter Your Security Answer",
    );
    const passwordInput = screen.getByPlaceholderText(
      "Enter Your New Password",
    );
    const button = screen.getByText("RESET PASSWORD");

    // Wrap all user interactions in act
    await act(async () => {
      await userEvent.type(emailInput, "wrong@example.com");
      await userEvent.type(answerInput, "wronganswer");
      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.click(button);
    });

    // Wait for the toast error to be called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Wrong Email Or Answer");
    });
  });

  it("should show fallback error message when API returns no error message", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false },
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Enter Your Security Answer"),
      { target: { value: "answer" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("RESET PASSWORD"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
  });

  it("should show error toast when email is empty", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    const answerInput = screen.getByPlaceholderText(
      "Enter Your Security Answer",
    );
    const passwordInput = screen.getByPlaceholderText(
      "Enter Your New Password",
    );
    const button = screen.getByText("RESET PASSWORD");

    // Act
    await act(async () => {
      await userEvent.type(answerInput, "MyAnswer");
      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.click(button);
    });

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("All fields are required"),
    );
  });

  it("should show error toast when security answer is empty", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    const passwordInput = screen.getByPlaceholderText(
      "Enter Your New Password",
    );
    const button = screen.getByText("RESET PASSWORD");

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.click(button);
    });

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("All fields are required"),
    );
  });

  it("should show error toast when new password is empty", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    const answerInput = screen.getByPlaceholderText(
      "Enter Your Security Answer",
    );
    const button = screen.getByText("RESET PASSWORD");

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(answerInput, "MyAnswer");
      await userEvent.click(button);
    });

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("All fields are required"),
    );
  });
});
