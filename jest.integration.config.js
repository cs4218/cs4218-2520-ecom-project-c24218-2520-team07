export default { // do not change
  // display name
  displayName: "integration",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/integration-tests/*.test.js"],

  transform: {},

  workerIdleMemoryLimit: '512MB',
 
  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/*.js", "!controllers/*.test.js"],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};