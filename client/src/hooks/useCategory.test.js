import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";

jest.mock("axios", () => ({
  get: jest.fn(),
}));

const axios = require("axios");

describe("useCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array at first", () => {
    axios.get.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCategory());

    expect(result.current).toEqual([]);
  });

  it("fetches and returns categories", async () => {
    const categoryList = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Clothing", slug: "clothing" },
    ];
    axios.get.mockResolvedValue({
      data: { category: categoryList },
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(categoryList);
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("returns empty when api fails", async () => {
    axios.get.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(result.current).toEqual([]);
  });
});
