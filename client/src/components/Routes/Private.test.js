// Goh En Rui Ryann A0252528A

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import PrivateRoute from "./Private";

jest.mock("axios");
jest.mock("mongoose", () => ({ set: jest.fn() }));

const mockUseAuth = jest.fn();

jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div>Outlet</div>,
}));

jest.mock("../Spinner", () => (props) => (
  // we will fake the Spinner component
  <div>Spinner {props.path}</div>
));

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Outlet when authenticated", async () => {
    // Arrange
    // set up the mock to return a token
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);
    // mock axios to return ok: true
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    // Act
    render(<PrivateRoute />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
    expect(await screen.findByText("Outlet")).toBeInTheDocument();
  });

  test("renders Spinner when auth check fails", async () => {
    // Arrange
    // set up the mock to return a token
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);
    // mock axios to return ok: false
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    // Act
    render(<PrivateRoute />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
    expect(screen.getByText(/spinner/i)).toBeInTheDocument();
  });

  test("renders Spinner when no token", async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

    // Act
    render(<PrivateRoute />);

    // Assert
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });

    expect(screen.getByText(/spinner/i)).toBeInTheDocument();
  });
});
