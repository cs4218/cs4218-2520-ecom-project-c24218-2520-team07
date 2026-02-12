import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import SearchInput from "./SearchInput";

const mockNavigate = jest.fn();
const mockSetValues = jest.fn();
const mockUseSearch = jest.fn();

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  // Preserve other exports from react-router-dom
  ...jest.requireActual("react-router-dom"),
  // Mock useNavigate
  useNavigate: () => mockNavigate,
}));

jest.mock("../../context/search", () => ({
  // Mock useSearch
  useSearch: () => mockUseSearch(),
}));

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders input with value and search button", () => {
    // Arrange
    const values = { keyword: "phone", results: [] };
    mockUseSearch.mockReturnValue([values, mockSetValues]);
    const input = screen.getByPlaceholderText(/search/i);

    // Act
    render(<SearchInput />);

    // Assert
    expect(input).toHaveValue("phone");
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("typing updates keyword via setValues", async () => {
    // Arrange
    const values = { keyword: "", results: [] };
    mockUseSearch.mockReturnValue([values, mockSetValues]);

    // Act
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "laptop" } });

    // Assert
    expect(mockSetValues).toHaveBeenCalledWith({
      ...values,
      keyword: "laptop",
    });
  });

  it("submitting searches, stores results, and navigates", async () => {
    // Arrange
    const values = { keyword: "tablet", results: [] };
    axios.get.mockResolvedValue({ data: { products: ["p1"] } });
    mockUseSearch.mockReturnValue([values, mockSetValues]);
    
    // Act
    render(<SearchInput />);
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/tablet");
    });
    expect(mockSetValues).toHaveBeenCalledWith({
      ...values,
      results: { products: ["p1"] },
    });
    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  it("does not navigate when search fails", async () => {
    // Arrange
    const values = { keyword: "tv", results: [] };
    axios.get.mockRejectedValue(new Error("network"));
    mockUseSearch.mockReturnValue([values, mockSetValues]);
    
    // Act
    render(<SearchInput />);
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/tv");
    });
    expect(mockSetValues).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
