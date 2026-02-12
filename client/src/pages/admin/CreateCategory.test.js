import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>Admin Menu</div>);

jest.mock("antd", () => ({
  Modal: ({ visible, children, onCancel }) =>
    visible ? (
      <div data-testid="modal">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        {children}
      </div>
    ) : null,
}));

const renderWithCategories = async (categories = []) => {
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: categories },
  });
  render(<CreateCategory />);
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
};

const getModal = () => screen.getByTestId("modal");
const actClick = async (el) => {
  await act(async () => {
    await userEvent.click(el);
  });
};
const actType = async (el, text) => {
  await act(async () => {
    await userEvent.type(el, text);
  });
};
const actClear = async (el) => {
  await act(async () => {
    await userEvent.clear(el);
  });
};

describe("CreateCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockReset();
    axios.post.mockReset();
    axios.put.mockReset();
    axios.delete.mockReset();
    toast.success?.mockReset?.();
    toast.error?.mockReset?.();
  });

  test("fetches categories on mount and renders rows", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);

    // Act
    // Component mount already triggered fetch.

    // Assert
    expect(await screen.findByText("Tech")).toBeInTheDocument();
  });

  test("creates category and refreshes list on success", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({ data: { success: true, category: [] } })
      .mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    // Act
    render(<CreateCategory />);

    const input = await screen.findByPlaceholderText(/enter new category/i);
    await actType(input, "Books");
    await actClick(screen.getByRole("button", { name: /submit/i }));

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Books" }
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Books is created");
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("shows error toast when create fails", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.post.mockRejectedValueOnce(new Error("fail"));

    // Act
    render(<CreateCategory />);
    const input = await screen.findByPlaceholderText(/enter new category/i);
    await actType(input, "Books");
    await actClick(screen.getByRole("button", { name: /submit/i }));

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith(
      "somthing went wrong in input form"
    );
  });

  test("shows error toast when create returns success false", async () => {
    // Arrange
    await renderWithCategories([]);
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Already exists" },
    });

    // Act
    const input = screen.getByPlaceholderText(/enter new category/i);
    await actType(input, "Books");
    await actClick(screen.getByRole("button", { name: /submit/i }));

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Already exists");
  });

  test("shows error toast when category fetch fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("fail"));

    // Act
    render(<CreateCategory />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting category"
    );

    consoleSpy.mockRestore();
  });

  test("shows error toast when get categories retrieval fails", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { success: false }});

    // Act
    render(<CreateCategory />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
  });

  test("updates category and refreshes list on success", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "1", name: "Tech" }] },
      })
      .mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    // Act
    render(<CreateCategory />);
    const editButton = await screen.findByRole("button", { name: /edit/i });
    await actClick(editButton);

    const modal = await screen.findByTestId("modal");
    const modalInput = within(modal).getByPlaceholderText(/enter new category/i);
    await actClear(modalInput);
    await actType(modalInput, "Gadgets");
    await actClick(
      within(modal).getByRole("button", { name: /submit/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Gadgets" }
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Gadgets is updated");
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("shows error toast when update returns success false", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: "Update failed" },
    });

    // Act
    const editButton = await screen.findByRole("button", { name: /edit/i });
    await actClick(editButton);

    const modal = getModal();
    await actClick(
      within(modal).getByRole("button", { name: /submit/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Update failed");
  });

  test("shows error toast when update fails", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    axios.put.mockRejectedValueOnce(new Error("fail"));

    // Act
    const editButton = await screen.findByRole("button", { name: /edit/i });
    await actClick(editButton);

    const modal = getModal();
    await actClick(
      within(modal).getByRole("button", { name: /submit/i })
    );

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
  });

  test("deletes category and refreshes list on success", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "1", name: "Tech" }] },
      })
      .mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    // Act
    render(<CreateCategory />);

    const deleteButton = await screen.findByRole("button", { name: /delete/i });
    await actClick(deleteButton);

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/1"
      );
    });
    expect(toast.success).toHaveBeenCalledWith("category is deleted");
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("shows error toast when delete returns success false", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: "Delete failed" },
    });

    // Act
    const deleteButton = await screen.findByRole("button", { name: /delete/i });
    await actClick(deleteButton);

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Delete failed");
  });

  test("shows error toast when delete fails", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);
    axios.delete.mockRejectedValueOnce(new Error("fail"));

    // Act
    const deleteButton = await screen.findByRole("button", { name: /delete/i });
    await actClick(deleteButton);

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
  });

  test("closes modal on cancel", async () => {
    // Arrange
    await renderWithCategories([{ _id: "1", name: "Tech" }]);

    // Act
    const editButton = await screen.findByRole("button", { name: /edit/i });
    await actClick(editButton);

    // Assert
    expect(getModal()).toBeInTheDocument();

    const modal = getModal();
    const cancelButton = within(modal).getByRole("button", { name: /cancel/i });
    await actClick(cancelButton);

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });
});
