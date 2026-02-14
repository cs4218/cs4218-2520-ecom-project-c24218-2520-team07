import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryForm from "./CategoryForm";

describe("CategoryForm", () => {
  const mockCategory = "technology";
  const mockSubmit = jest.fn((e) => e.preventDefault());
  const mockSetter = jest.fn();
  const mockNewCategory = "health";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders input and submit button", () => {
    // Arrange
    const input = screen.getByPlaceholderText(/enter new category/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });
    
    // Act
    render(
      <CategoryForm
        value={mockCategory}
        handleSubmit={mockSubmit}
        setValue={mockSetter}
      />
    );
    
    // Assert
    expect(input).toHaveValue(mockCategory);
    expect(submitButton).toBeInTheDocument();
  });

  it("updates value on typing", async () => {
    // Arrange
    const input = screen.getByPlaceholderText(/enter new category/i);
    
    // Act
    render(
      <CategoryForm
        value=""
        handleSubmit={mockSubmit}
        setValue={mockSetter}
      />
    );

    fireEvent.change(input, { target: { value: mockNewCategory } });

    // Assert
    expect(mockSetter).toHaveBeenCalledWith(mockNewCategory);
  });

  it("calls handleSubmit on form submit", async () => {
    // Arrange
    const submitButton = screen.getByRole("button", { name: /submit/i });
    
    // Act
    render(
      <CategoryForm
        value={mockCategory}
        handleSubmit={mockSubmit}
        setValue={mockSetter}
      />
    );
    await userEvent.click(submitButton);

    // Assert
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});
