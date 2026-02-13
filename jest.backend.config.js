export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/models/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js", 
    "helpers/**/*.js", 
    "middlewares/**/*.js", 
    "models/**/*.js"],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};
