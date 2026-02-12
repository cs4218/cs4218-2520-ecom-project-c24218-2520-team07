import { describe, expect, test } from "@jest/globals";
import User from "./userModel.js";

const baseUser = {
  name: "Alice",
  email: "alice@example.com",
  password: "secret",
  phone: "12345678",
  address: "123 Road",
  answer: "blue",
};

describe("userModel", () => {
  test.each(["name", "email", "password", "phone", "address", "answer"])(
    "requires %s",
    (field) => {
      // Arrange
      const data = { ...baseUser };
      delete data[field];
      const user = new User(data);

      // Act
      const error = user.validateSync();

      // Assert
      expect(error.errors[field]).toBeDefined();
    }
  );

  test("defaults role to 0", () => {
    // Arrange
    const user = new User(baseUser);

    // Act
    // No additional action required.

    // Assert
    expect(user.role).toBe(0);
  });

  test("trims name", () => {
    // Arrange
    const user = new User({ ...baseUser, name: "  Alice  " });

    // Act
    user.validateSync();

    // Assert
    expect(user.name).toBe("Alice");
  });
});
