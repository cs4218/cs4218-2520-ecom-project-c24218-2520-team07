// Lim Yih Fei A0256993J
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { SearchProvider, useSearch } from "../context/search"; // Adjust path


describe("SearchContext & useSearch Hook", () => {
  it("should provide the initial state and update correctly", () => {
    // Arrange
    const wrapper = ({ children }) => <SearchProvider>{children}</SearchProvider>;
    const { result } = renderHook(() => useSearch(), { wrapper });

    // Assert: Check Initial State
    const [initialAuth] = result.current;
    expect(initialAuth.keyword).toBe("");
    expect(initialAuth.results).toEqual([]);

    // Act: Perform update
    const [, setAuth] = result.current;
    act(() => {
      setAuth({
        keyword: "laptop",
        results: [{ id: 1, name: "MacBook Pro" }],
      });
    });

    // Assert: Verify Update
    const [updatedAuth] = result.current;
    expect(updatedAuth.keyword).toBe("laptop");
    expect(updatedAuth.results).toHaveLength(1);
    expect(updatedAuth.results[0].name).toBe("MacBook Pro");
  });

  it("should maintain results structure when keyword is updated", () => {
    // Arrange
    const wrapper = ({ children }) => <SearchProvider>{children}</SearchProvider>;
    const { result } = renderHook(() => useSearch(), { wrapper });
    const [, setAuth] = result.current;

    // Act
    act(() => {
      setAuth({
        keyword: "phone",
        results: [{ id: 2, name: "iPhone" }],
      });
    });

    // Assert
    const [currentAuth] = result.current;
    expect(currentAuth.keyword).toBe("phone");
    expect(currentAuth.results[0].name).toBe("iPhone");
  });
});