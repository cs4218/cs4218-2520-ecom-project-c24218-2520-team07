// Goh En Rui Ryann A0252528A

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

describe("UserMenu", () => {
  test("renders profile and orders links", () => {
    // Arrange
    const profileLink = screen.getByRole("link", { name: /profile/i });
    const ordersLink = screen.getByRole("link", { name: /orders/i });

    // Act
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Assert
    expect(profileLink.getAttribute("href")).toBe("/dashboard/user/profile");
    expect(ordersLink.getAttribute("href")).toBe("/dashboard/user/orders");
  });
});
