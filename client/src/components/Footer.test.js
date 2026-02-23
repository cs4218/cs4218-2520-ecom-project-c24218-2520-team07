import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

describe("Footer", () => {
  it("displays copyright text", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/All Rights Reserved © TestingComp/i),
    ).toBeInTheDocument();
  });

  it("renders About link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const aboutLink = screen.getByText("About");
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink.closest("a")).toHaveAttribute("href", "/about");
  });

  it("renders Contact link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const contactLink = screen.getByText("Contact");
    expect(contactLink).toBeInTheDocument();
    expect(contactLink.closest("a")).toHaveAttribute("href", "/contact");
  });

  it("renders Privacy Policy link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const policyLink = screen.getByText("Privacy Policy");
    expect(policyLink).toBeInTheDocument();
    expect(policyLink.closest("a")).toHaveAttribute("href", "/policy");
  });

  it("applies footer CSS class", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(container.querySelector(".footer")).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
