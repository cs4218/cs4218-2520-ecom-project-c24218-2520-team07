import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth";

/**
 * Test helper component to consume AuthContext
 */
const TestComponent = () => {
  const [auth, setAuth] = useAuth();

  return (
    <>
      <div data-testid="user">{auth.user ? auth.user.name : "no-user"}</div>
      <div data-testid="token">{auth.token || "no-token"}</div>
      <button
        onClick={() =>
          setAuth({
            user: { name: "Alice" },
            token: "new-token",
          })
        }
      >
        Update Auth
      </button>
    </>
  );
};

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );

describe("AuthContext / AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    delete axios.defaults.headers.common.Authorization;
  });

  describe("initial state", () => {
    it("initialises with default auth state when localStorage is empty", () => {
      renderWithProvider();

      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    });
  });

  describe("loading auth from localStorage", () => {
    it("loads user and token from localStorage on mount", async () => {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: { name: "John" },
          token: "test-token",
        }),
      );

      await act(async () => {
        renderWithProvider();
      });

      expect(screen.getByTestId("user")).toHaveTextContent("John");
      expect(screen.getByTestId("token")).toHaveTextContent("test-token");
    });

    it("sets axios Authorization header from stored token", async () => {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: { name: "Jane" },
          token: "secure-token",
        }),
      );

      await act(async () => {
        renderWithProvider();
      });

      expect(axios.defaults.headers.common.Authorization).toBe("secure-token");
    });

    it("handles missing user or token gracefully", async () => {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: null,
        }),
      );

      await act(async () => {
        renderWithProvider();
      });

      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    });
  });

  describe("auth state updates", () => {
    it("updates auth state using setAuth from useAuth", async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByText("Update Auth").click();
      });

      expect(screen.getByTestId("user")).toHaveTextContent("Alice");
      expect(screen.getByTestId("token")).toHaveTextContent("new-token");
    });

    it("updates axios Authorization header when token changes", async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByText("Update Auth").click();
      });

      expect(axios.defaults.headers.common.Authorization).toBe("new-token");
    });
  });

  describe("edge cases", () => {
    it("falls back to default state when localStorage contains invalid JSON", () => {
      localStorage.setItem("auth", "{invalid-json");

      const warnMock = jest.spyOn(console, "warn").mockImplementation(() => {});

      act(() => {
        renderWithProvider();
      });

      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      expect(screen.getByTestId("token")).toHaveTextContent("no-token");
      warnMock.mockRestore();
    });
  });
});
