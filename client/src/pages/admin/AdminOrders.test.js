import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import AdminOrders from "./AdminOrders";

jest.mock("axios");

jest.mock("moment", () => () => ({ fromNow: () => "a moment ago" }));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);

const mockUseAuth = jest.fn();

jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("antd", () => {
  const Select = ({ children, onChange, defaultValue }) => (
    <select
      defaultValue={defaultValue}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  const Option = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  Select.Option = Option;
  return { Select };
});

const mockOrders = [
  {
    _id: "o1",
    status: "Not Process",
    buyer: { name: "Alice" },
    createAt: "2024-01-01T00:00:00Z",
    payment: { success: true },
    products: [
      {
        _id: "p1",
        name: "Phone",
        description: "Smartphone",
        price: 100,
      },
    ],
  },
  {
    _id: "o2",
    status: "cancel",
    buyer: { name: "Bob" },
    createAt: "2024-01-02T00:00:00Z",
    payment: { success: false },
    products: [
      {
        _id: "p2",
        name: "Laptop",
        description: "Ultrabook",
        price: 2000,
      },
    ],
  },
];

describe("AdminOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithAuth = (token = "t") => {
    mockUseAuth.mockReturnValue([{ token }, jest.fn()]);
    return render(<AdminOrders />);
  };

  const getFirstStatusSelect = () => screen.getAllByRole("combobox")[0];

  const silenceConsole = () =>
    jest.spyOn(console, "log").mockImplementation(() => {});

  test("fetches orders when auth token exists", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    // Act
    renderWithAuth();

    // Assert
    await waitFor(() => {
      // Assert
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  test("updates order status and refetches", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({ data: mockOrders })
      .mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    // Act
    renderWithAuth();
    await screen.findByText("Alice");
    const select = getFirstStatusSelect();
    await userEvent.selectOptions(select, "Processing");

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/o1",
        { status: "Processing" }
      );
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("does not fetch orders when auth token is missing", async () => {
    // Arrange
    renderWithAuth(null);

    // Assert
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  test("logs error when fetching orders fails", async () => {
    // Arrange
    const consoleSpy = silenceConsole();
    axios.get.mockRejectedValueOnce(new Error("fail"));

    // Act
    renderWithAuth();

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test("logs error when updating status fails", async () => {
    // Arrange
    const consoleSpy = silenceConsole();
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error("fail"));

    // Act
    renderWithAuth();
    await screen.findByText("Alice");
    const select = getFirstStatusSelect();
    await userEvent.selectOptions(select, "Processing");

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/o1",
        { status: "Processing" }
      );
    });
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
