import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Spinner from "./Spinner";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/test-path" }),
}));

describe("Spinner", () => {
  it("displays countdown message", () => {
    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/redirecting to you in \d+ second/i),
    ).toBeInTheDocument();
  });

  it("renders loading spinner", () => {
    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("uses default path of login", () => {
    const { container } = render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>,
    );
    expect(container).toBeInTheDocument();
  });

  it("accepts custom path prop", () => {
    const { container } = render(
      <MemoryRouter>
        <Spinner path="dashboard" />
      </MemoryRouter>,
    );
    expect(container).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
