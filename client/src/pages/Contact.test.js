import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock("react-icons/bi", () => ({
  BiMailSend: () => <span data-testid="mail-icon">Mail</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">Phone</span>,
  BiSupport: () => <span data-testid="support-icon">Support</span>,
}));

describe("Contact", () => {
  it("renders within Layout with correct title", () => {
    const { container } = render(<Contact />);
    const layout = container.querySelector('[data-title="Contact us"]');
    expect(layout).toBeInTheDocument();
  });

  it("displays CONTACT US heading", () => {
    render(<Contact />);
    expect(screen.getByText("CONTACT US")).toBeInTheDocument();
  });

  it("shows contact information text", () => {
    render(<Contact />);
    expect(
      screen.getByText(/For any query or info about product/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/We are available 24X7/i)).toBeInTheDocument();
  });

  it("displays email contact with icon", () => {
    render(<Contact />);
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
    expect(screen.getByText(/www.help@ecommerceapp.com/i)).toBeInTheDocument();
  });

  it("displays phone number with icon", () => {
    render(<Contact />);
    expect(screen.getByTestId("phone-icon")).toBeInTheDocument();
    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();
  });

  it("displays toll-free number with icon", () => {
    render(<Contact />);
    expect(screen.getByTestId("support-icon")).toBeInTheDocument();
    expect(screen.getByText(/1800-0000-0000/i)).toBeInTheDocument();
    expect(screen.getByText(/toll free/i)).toBeInTheDocument();
  });

  it("renders contact image", () => {
    render(<Contact />);
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });
});
// Cleon Tan De Xuan, A0252030B
