import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import SearchInput from "./SearchInput";
import { useSearch } from "../../context/search";
import { useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";

// --- ARRANGE: Mocks ---
jest.mock("axios");
jest.mock("../../context/search");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("SearchInput Component", () => {
  const setValuesMock = jest.fn();
  const navigateMock = jest.fn();
  const mockValues = { keyword: "", results: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    useSearch.mockReturnValue([mockValues, setValuesMock]);
    useNavigate.mockReturnValue(navigateMock);
  });

  test("should update context value on input change", () => {
    // --- ACT ---
    render(<SearchInput />);
    const input = screen.getByPlaceholderText("Search");
    
    fireEvent.change(input, { target: { value: "laptop" } });

    // --- ASSERT ---
    // Verifies the onChange handler (Line 29)
    expect(setValuesMock).toHaveBeenCalledWith({
      ...mockValues,
      keyword: "laptop",
    });
  });

  test("should fetch data and navigate on form submission", async () => {
    // --- ARRANGE ---
    const mockData = [{ id: 1, name: "Laptop" }];
    const valuesWithKeyword = { keyword: "laptop", results: [] };
    
    useSearch.mockReturnValue([valuesWithKeyword, setValuesMock]);
    axios.get.mockResolvedValue({ data: mockData });

    // --- ACT ---
    render(<SearchInput />);
    const submitButton = screen.getByRole("button", { name: /search/i });
    
    fireEvent.click(submitButton);

    // --- ASSERT ---
    // 1. Check API call (Line 12)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
    });

    // 2. Check context update (Line 15)
    expect(setValuesMock).toHaveBeenCalledWith({
      ...valuesWithKeyword,
      results: mockData,
    });

    // 3. Check navigation (Line 16)
    expect(navigateMock).toHaveBeenCalledWith("/search");
  });

  test("should log error if API call fails", async () => {
    // --- ARRANGE ---
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    useSearch.mockReturnValue([{ keyword: "test", results: [] }, setValuesMock]);
    const mockError = new Error("Network Error");
    axios.get.mockRejectedValue(mockError);

    // --- ACT ---
    render(<SearchInput />);
    fireEvent.submit(screen.getByRole("search"));

    // --- ASSERT ---
    // This covers the catch block (Line 18)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });
    consoleSpy.mockRestore();
  });
});