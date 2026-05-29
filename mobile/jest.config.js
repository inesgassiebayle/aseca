module.exports = {
  preset: "jest-expo",
  testMatch: [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/tests/*.spec.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
  testTimeout: 120000,
};