import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  try {
    // Lin Bin A0258760W: Input validation
    if (typeof password !== "string") {
      return Promise.reject(new Error("Password must be a string"));
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log(error);
  }
};

export const comparePassword = async (password, hashedPassword) => {

  // Lin Bin A0258760W: Input validation
  if (typeof password !== "string") {
    return Promise.reject(new Error("Password must be a string"));
  }
  if (typeof hashedPassword !== "string" || !hashedPassword) {
    return Promise.reject(
      new Error("Hashed password must be a non-empty string"),
    );
  }
  return bcrypt.compare(password, hashedPassword);
};
