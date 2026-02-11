import { hashPassword, comparePassword } from "./authHelper";
import bcrypt from "bcrypt";

describe("authHelper - Password Utilities", () => {
  describe("hashPassword", () => {
    it("EP: should hash a valid password", async () => {
      const password = "password123";

      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });

    it("BVA: should hash an empty string password", async () => {
      const password = "";

      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });

    it("BVA: should hash a very long password", async () => {
      const password = "a".repeat(1000);

      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });

    it("EP: should throw for invalid password type", async () => {
      await expect(hashPassword(null)).rejects.toThrow(
        "Password must be a string",
      );
      await expect(hashPassword(undefined)).rejects.toThrow(
        "Password must be a string",
      );
      await expect(hashPassword(12345)).rejects.toThrow(
        "Password must be a string",
      );
    });
  });

  describe("hashPassword - error handling", () => {
    it("should hit the catch block when bcrypt.hash throws", async () => {
      // Mock bcrypt.hash to throw an error
      jest.spyOn(bcrypt, "hash").mockImplementation(() => {
        throw new Error("Mocked bcrypt error");
      });

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const result = await hashPassword("validPassword");

      // The catch block logs the error, so result is undefined
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore the mocks
      bcrypt.hash.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe("comparePassword", () => {
    it("EP: should return true for correct password", async () => {
      const password = "securePass";
      const hashed = await bcrypt.hash(password, 10);

      const result = await comparePassword(password, hashed);

      expect(result).toBe(true);
    });

    it("EP: should return false for incorrect password", async () => {
      const password = "securePass";
      const hashed = await bcrypt.hash(password, 10);

      const result = await comparePassword("wrongPass", hashed);

      expect(result).toBe(false);
    });

    it("BVA: should return false for empty password", async () => {
      const password = "securePass";
      const hashed = await bcrypt.hash(password, 10);

      const result = await comparePassword("", hashed);

      expect(result).toBe(false);
    });

    it('BVA: should return true for empty password with correct hash of ""', async () => {
      const emptyPassword = "";
      const hashedEmptyPassword = await bcrypt.hash(emptyPassword, 10);

      const result = await comparePassword("", hashedEmptyPassword);

      expect(result).toBe(true);
    });

    it("EP: should reject for invalid hash type", async () => {
      await expect(comparePassword("password", null)).rejects.toThrow(
        "Hashed password must be a non-empty string",
      );
      await expect(comparePassword("password", undefined)).rejects.toThrow(
        "Hashed password must be a non-empty string",
      );
      await expect(comparePassword("password", 12345)).rejects.toThrow(
        "Hashed password must be a non-empty string",
      );
    });

    it("should reject if password is not a string", async () => {
      await expect(
        comparePassword(null, "$2b$10$saltsaltsalt"),
      ).rejects.toThrow("Password must be a string");

      await expect(
        comparePassword(undefined, "$2b$10$saltsaltsalt"),
      ).rejects.toThrow("Password must be a string");

      await expect(
        comparePassword(12345, "$2b$10$saltsaltsalt"),
      ).rejects.toThrow("Password must be a string");
    });

    it("BVA: should throw for empty hashed password", async () => {
      await expect(comparePassword("password", "")).rejects.toThrow(
        "Hashed password must be a non-empty string",
      );
    });
  });
});
