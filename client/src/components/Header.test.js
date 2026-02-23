import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import toast from "react-hot-toast";

jest.mock("react-hot-toast");

jest.mock("./Form/SearchInput", () => () => (
  <div data-testid="search-input">SearchInput</div>
));

jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => null,
}));

const mockSetAuth = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCart = jest.fn();

jest.mock("../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../context/cart", () => ({
  useCart: () => mockUseCart(),
}));

jest.mock("../hooks/useCategory", () => () => [
  { _id: "1", name: "Electronics", slug: "electronics" },
  { _id: "2", name: "Clothing", slug: "clothing" },
]);

jest.mock("antd", () => ({
  Badge: ({ children, count }) => (
    <div data-badge-count={count}>{children}</div>
  ),
}));

describe("Header - Unauthenticated User", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue([
      {
        user: null,
        token: "",
      },
      mockSetAuth,
    ]);
    mockUseCart.mockReturnValue([[]]);
  });

  // Output-based testing - verify navigation links
  it("renders brand logo with link", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const brandLink = screen.getByText(/🛒 Virtual Vault/);
    expect(brandLink).toBeInTheDocument();
    expect(brandLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("displays Home navigation link", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("shows Register and Login links for unauthenticated users", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders Categories dropdown with All Categories link", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  it("displays category links in dropdown", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();
  });

  it("renders SearchInput component", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("displays Cart link with badge", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  it("shows cart badge with count of 0 for empty cart", () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const badge = container.querySelector("[data-badge-count='0']");
    expect(badge).toBeInTheDocument();
  });
});

describe("Header - Authenticated Regular User", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue([
      {
        user: { name: "John Doe", role: 0 },
        token: "test-token",
      },
      mockSetAuth,
    ]);
    mockUseCart.mockReturnValue([[]]);
  });

  it("displays user name in dropdown for authenticated users", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows Dashboard link pointing to user dashboard", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/user",
    );
  });

  it("does not show Register and Login links for authenticated users", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Register")).not.toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("displays Logout link", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
});

describe("Header - Authenticated Admin User", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue([
      {
        user: { name: "Admin User", role: 1 },
        token: "admin-token",
      },
      mockSetAuth,
    ]);
    mockUseCart.mockReturnValue([[]]);
  });

  it("shows Dashboard link pointing to admin dashboard for admin users", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin",
    );
  });
});

describe("Header - Logout Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue([
      {
        user: { name: "Test User", role: 0 },
        token: "test-token",
      },
      mockSetAuth,
    ]);
    mockUseCart.mockReturnValue([[]]);
    Storage.prototype.removeItem = jest.fn();
  });

  // Communication-based testing - verify logout behavior
  it("clears auth state on logout", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const logoutLink = screen.getByText("Logout");
    fireEvent.click(logoutLink);

    expect(mockSetAuth).toHaveBeenCalledWith({
      user: null,
      token: "",
    });
  });

  it("removes auth from localStorage on logout", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const logoutLink = screen.getByText("Logout");
    fireEvent.click(logoutLink);

    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
  });

  it("shows success toast on logout", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const logoutLink = screen.getByText("Logout");
    fireEvent.click(logoutLink);

    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });
});

describe("Header - Cart with Items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue([
      {
        user: null,
        token: "",
      },
      mockSetAuth,
    ]);
    mockUseCart.mockReturnValue([[{ id: 1 }, { id: 2 }, { id: 3 }]]);
  });

  it("shows correct cart count in badge", () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const badge = container.querySelector("[data-badge-count='3']");
    expect(badge).toBeInTheDocument();
  });
});
// Cleon Tan De Xuan, A0252030B
