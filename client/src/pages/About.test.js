import React from "react";
import { render, screen } from "@testing-library/react";
import About from "./About";

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

describe("About", () => {
  it("renders within Layout with correct title", () => {
    const { container } = render(<About />);
    const layout = container.querySelector(
      '[data-title="About us - Ecommerce app"]',
    );
    expect(layout).toBeInTheDocument();
  });

  it("displays about text placeholder", () => {
    render(<About />);
    expect(screen.getByText("Add text")).toBeInTheDocument();
  });

  it("renders about image", () => {
    render(<About />);
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/about.jpeg");
  });

  it("uses correct layout structure", () => {
    const { container } = render(<About />);
    expect(container.querySelector(".row.contactus")).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
