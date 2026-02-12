// Goh En Rui Ryann A0252528A

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("./../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("./../../components/AdminMenu", () => () => <div>AdminMenu</div>);

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("antd", () => {
  const Select = ({ children, onChange, value, placeholder }) => (
    <select
      aria-label={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  return { Select };
});

describe("CreateProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockReset();
    axios.post.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    mockNavigate.mockReset();
  });

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:preview");
  });

  const renderWithCategories = async (categories = []) => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: categories },
    });
    render(<CreateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
  };

  const renderWithCategoriesResult = async (data) => {
    axios.get.mockResolvedValueOnce({ data });
    render(<CreateProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
  };

  const uploadPhoto = async (fileName = "test.png") => {
    const fileInput = screen.getByLabelText(/upload photo/i);
    const file = new File(["image"], fileName, { type: "image/png" });
    await userEvent.upload(fileInput, file);
    return file;
  };

  const fillRequiredFields = async () => {
    const categorySelect = screen.getByLabelText(/select a category/i);
    await userEvent.selectOptions(categorySelect, "1");

    await userEvent.type(screen.getByPlaceholderText(/write a name/i), "Phone");
    await userEvent.type(
      screen.getByPlaceholderText(/write a description/i),
      "Smartphone"
    );
    await userEvent.type(screen.getByPlaceholderText(/write a price/i), "499");
    await userEvent.type(
      screen.getByPlaceholderText(/write a quantity/i),
      "10"
    );

    const shippingSelect = screen.getByLabelText(/select shipping/i);
    await userEvent.selectOptions(shippingSelect, "1");
  };

  const submitForm = async () => {
    await userEvent.click(
      screen.getByRole("button", { name: /create product/i })
    );
  };

  test("fetches categories on mount and renders options", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);

    // Act
    // Component mount already triggered category fetch.

    // Assert
    expect(await screen.findByText("Tech")).toBeInTheDocument();
  });

  test("does not render categories when success is false", async () => {
    // Arrange
    await renderWithCategoriesResult({
      success: false,
      category: [{ _id: "1", name: "Tech" }],
    });

    // Assert
    expect(screen.queryByText("Tech")).not.toBeInTheDocument();
  });

  test("shows error toast when category fetch fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("fail"));

    // Act
    await renderWithCategoriesResult({ success: false, category: [] });

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "Something wwent wrong in getting catgeory"
    );

    consoleSpy.mockRestore();
  });

  test("shows photo preview after upload", async () => {
    // Arrange
    await renderWithCategories([]);

    // Act
    await uploadPhoto();

    // Assert
    const preview = screen.getByAltText("product_photo");
    expect(preview).toBeInTheDocument();
    expect(preview.getAttribute("src")).toBe("blob:preview");
  });

  test("creates product and navigates on submit", async () => {
    // Arrange
    axios.post.mockReturnValueOnce({ data: { success: false } });

    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    await screen.findByRole("option", { name: "Tech" });

    // Act
    await fillRequiredFields();
    const file = await uploadPhoto();
    await submitForm();

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/create-product",
        expect.any(FormData)
      );
    });

    const formData = axios.post.mock.calls[0][1];
    expect(formData.get("name")).toBe("Phone");
    expect(formData.get("description")).toBe("Smartphone");
    expect(formData.get("price")).toBe("499");
    expect(formData.get("quantity")).toBe("10");
    expect(formData.get("category")).toBe("1");
    expect(formData.get("photo")).toBe(file);

    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  test("shows error toast when API returns success true", async () => {
    // Arrange
    axios.post.mockReturnValueOnce({
      data: { success: true, message: "Already exists" },
    });

    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    await screen.findByRole("option", { name: "Tech" });

    // Act
    await fillRequiredFields();
    await submitForm();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Already exists");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows error toast when create throws", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.post.mockImplementationOnce(() => {
      throw new Error("fail");
    });

    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    await screen.findByRole("option", { name: "Tech" });

    // Act
    await submitForm();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });

    consoleSpy.mockRestore();
  });
});
