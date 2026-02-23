import React from "react";
import { render, screen } from "@testing-library/react";
import Policy from "./Policy";

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

describe("Policy", () => {
  it("renders within Layout with correct title", () => {
    const { container } = render(<Policy />);
    const layout = container.querySelector('[data-title="Privacy Policy"]');
    expect(layout).toBeInTheDocument();
  });

  it("displays privacy policy placeholder text", () => {
    render(<Policy />);
    const policyTexts = screen.getAllByText("add privacy policy");
    expect(policyTexts).toHaveLength(7);
  });

  it("renders policy image", () => {
    render(<Policy />);
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  it("uses correct layout structure", () => {
    const { container } = render(<Policy />);
    expect(container.querySelector(".row.contactus")).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
