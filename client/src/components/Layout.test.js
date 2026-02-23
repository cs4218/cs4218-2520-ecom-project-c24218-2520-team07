import React from "react";
import { render, screen } from "@testing-library/react";
import Layout from "./Layout";

jest.mock("./Header", () => () => <div data-testid="header">Header</div>);
jest.mock("./Footer", () => () => <div data-testid="footer">Footer</div>);

jest.mock("react-helmet", () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>,
}));

jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe("Layout", () => {
  // Output-based testing - verify component structure
  it("renders Header component", () => {
    render(<Layout>Test Content</Layout>);

    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders Footer component", () => {
    render(<Layout>Test Content</Layout>);

    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Layout>Test Content</Layout>);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders Toaster for notifications", () => {
    render(<Layout>Test Content</Layout>);

    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("wraps children in main element with minimum height", () => {
    const { container } = render(<Layout>Test Content</Layout>);

    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveStyle({ minHeight: "70vh" });
  });

  // Testing default props
  it("uses default title when not provided", () => {
    render(<Layout>Content</Layout>);

    expect(screen.getByTestId("helmet")).toBeInTheDocument();
  });

  it("applies custom title when provided", () => {
    const { container } = render(
      <Layout title="Custom Page Title">Content</Layout>,
    );

    expect(container).toBeInTheDocument();
  });

  it("applies custom description when provided", () => {
    const { container } = render(
      <Layout description="Custom description">Content</Layout>,
    );

    expect(container).toBeInTheDocument();
  });

  it("applies custom keywords when provided", () => {
    const { container } = render(
      <Layout keywords="custom, keywords">Content</Layout>,
    );

    expect(container).toBeInTheDocument();
  });

  it("applies custom author when provided", () => {
    const { container } = render(
      <Layout author="Custom Author">Content</Layout>,
    );

    expect(container).toBeInTheDocument();
  });

  // Structure validation
  it("maintains correct component hierarchy", () => {
    const { container } = render(<Layout>Content</Layout>);

    const wrapper = container.firstChild;
    expect(wrapper).toBeInTheDocument();

    const header = screen.getByTestId("header");
    const main = container.querySelector("main");
    const footer = screen.getByTestId("footer");

    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
