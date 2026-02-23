import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

describe("Pagenotfound", () => {
  it("renders within Layout with correct title", () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    const layout = container.querySelector(
      '[data-title="go back- page not found"]',
    );
    expect(layout).toBeInTheDocument();
  });

  it("displays 404 error code", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
  });

  it("renders Go Back link to homepage", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    const link = screen.getByText("Go Back");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("applies correct CSS classes", () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    expect(container.querySelector(".pnf")).toBeInTheDocument();
    expect(container.querySelector(".pnf-title")).toBeInTheDocument();
    expect(container.querySelector(".pnf-heading")).toBeInTheDocument();
    expect(container.querySelector(".pnf-btn")).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
