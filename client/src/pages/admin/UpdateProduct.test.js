import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

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
  useParams: () => ({ slug: "test-slug" }),
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

describe("UpdateProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockReset();
    axios.put.mockReset();
    axios.delete.mockReset();
    toast.success?.mockReset?.();
    toast.error?.mockReset?.();
    mockNavigate.mockReset();
  });

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:preview");
  });

  const mockProductResponse = {
    data: {
      product: {
        _id: "p1",
        name: "Phone",
        description: "Smartphone",
        price: 499,
        quantity: 10,
        shipping: 1,
        category: { _id: "c1", name: "Tech" },
      },
    },
  };

  const mockCategoriesResponse = {
    data: { success: true, category: [{ _id: "c1", name: "Tech" }] },
  };

  const setupGetMocks = ({
    productError,
    categoryError,
    productResponse = mockProductResponse,
    categoriesResponse = mockCategoriesResponse,
  } = {}) => {
    axios.get.mockImplementation((url) => {
      if (url.startsWith("/api/v1/product/get-product/")) {
        return productError
          ? Promise.reject(productError)
          : Promise.resolve(productResponse);
      }
      if (url === "/api/v1/category/get-category") {
        return categoryError
          ? Promise.reject(categoryError)
          : Promise.resolve(categoriesResponse);
      }
      return Promise.reject(new Error("unknown"));
    });
  };

  const renderWithData = async () => {
    setupGetMocks();
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Phone");
  };

  test("loads product and categories on mount", async () => {
    // Arrange
    setupGetMocks();

    // Act
    render(<UpdateProduct />);

    // Assert
    const nameInput = await screen.findByDisplayValue("Phone");
    expect(nameInput).toBeInTheDocument();

    const categorySelect = screen.getByLabelText(/select a category/i);
    await waitFor(() => {
      expect(categorySelect).toHaveValue("c1");
    });

    const preview = screen.getByAltText("product_photo");
    expect(preview.getAttribute("src")).toBe(
      "/api/v1/product/product-photo/p1"
    );
  });

  test("logs error when product fetch fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    setupGetMocks({ productError: new Error("fail") });

    // Act
    render(<UpdateProduct />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-slug"
      );
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("shows error toast when category fetch fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    setupGetMocks({ categoryError: new Error("fail") });

    // Act
    render(<UpdateProduct />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Something wwent wrong in getting catgeory"
    );

    consoleSpy.mockRestore();
  });

  test("does not render categories when success is false", async () => {
    // Arrange
    setupGetMocks({
      categoriesResponse: {
        data: { success: false, category: [{ _id: "c1", name: "Tech" }] },
      },
    });

    // Act
    render(<UpdateProduct />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    expect(screen.queryByText("Tech")).not.toBeInTheDocument();
  });

  test("updates form fields and shows new photo preview", async () => {
    // Arrange
    await renderWithData();

    // Act
    const categorySelect = screen.getByLabelText(/select a category/i);
    await userEvent.selectOptions(categorySelect, "c1");

    await userEvent.clear(screen.getByPlaceholderText(/write a name/i));
    await userEvent.type(screen.getByPlaceholderText(/write a name/i), "PhoneX");
    await userEvent.clear(
      screen.getByPlaceholderText(/write a description/i)
    );
    await userEvent.type(
      screen.getByPlaceholderText(/write a description/i),
      "New phone"
    );
    await userEvent.clear(screen.getByPlaceholderText(/write a price/i));
    await userEvent.type(screen.getByPlaceholderText(/write a price/i), "999");
    await userEvent.clear(screen.getByPlaceholderText(/write a quantity/i));
    await userEvent.type(
      screen.getByPlaceholderText(/write a quantity/i),
      "5"
    );

    const shippingSelect = screen.getByLabelText(/select shipping/i);
    await userEvent.selectOptions(shippingSelect, "1");

    const fileInput = screen.getByLabelText(/upload photo/i);
    const file = new File(["image"], "new.png", { type: "image/png" });
    await userEvent.upload(fileInput, file);

    // Assert
    const preview = screen.getByAltText("product_photo");
    expect(preview).toHaveAttribute("src", "blob:preview");
  });

  test("updates product and navigates on submit", async () => {
    // Arrange
    setupGetMocks();
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    // Act
    render(<UpdateProduct />);

    await screen.findByDisplayValue("Phone");

    await userEvent.click(
      screen.getByRole("button", { name: /update product/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/p1",
        expect.any(FormData)
      );
    });

    const formData = axios.put.mock.calls[0][1];
    expect(formData.get("name")).toBe("Phone");
    expect(formData.get("description")).toBe("Smartphone");
    expect(formData.get("price")).toBe("499");
    expect(formData.get("quantity")).toBe("10");
    expect(formData.get("category")).toBe("c1");

    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  test("includes photo in update payload when provided", async () => {
    // Arrange
    await renderWithData();
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    // Act
    const fileInput = screen.getByLabelText(/upload photo/i);
    const file = new File(["image"], "new.png", { type: "image/png" });
    await userEvent.upload(fileInput, file);

    await userEvent.click(
      screen.getByRole("button", { name: /update product/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/p1",
        expect.any(FormData)
      );
    });

    const formData = axios.put.mock.calls[0][1];
    expect(formData.get("photo")).toBe(file);
  });

  test("shows error toast when update returns success true", async () => {
    // Arrange
    await renderWithData();
    axios.put.mockReturnValueOnce({
      data: { success: true, message: "Update failed" },
    });

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: /update product/i })
    );

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows error toast when update throws", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await renderWithData();
    axios.put.mockImplementationOnce(() => {
      throw new Error("fail");
    });

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: /update product/i })
    );

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("deletes product when confirmed", async () => {
    // Arrange
    setupGetMocks();
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");

    // Act
    render(<UpdateProduct />);

    await screen.findByDisplayValue("Phone");

    await userEvent.click(
      screen.getByRole("button", { name: /delete product/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/product/delete-product/p1"
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");

    promptSpy.mockRestore();
  });

  test("shows error toast when delete fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await renderWithData();
    axios.delete.mockRejectedValueOnce(new Error("fail"));
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: /delete product/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/product/delete-product/p1"
      );
    });
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    expect(consoleSpy).toHaveBeenCalled();

    promptSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test("does not delete when prompt is canceled", async () => {
    // Arrange
    setupGetMocks();
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("");

    // Act
    render(<UpdateProduct />);

    await screen.findByDisplayValue("Phone");

    await userEvent.click(
      screen.getByRole("button", { name: /delete product/i })
    );

    // Assert
    expect(axios.delete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    promptSpy.mockRestore();
  });
});
