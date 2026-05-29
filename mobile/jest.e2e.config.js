module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.spec.ts"],
  testTimeout: 60000,
  maxWorkers: 1,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {  // ← mueve config aquí, fuera de globals
      tsconfig: {
        module: "commonjs",
      },
    }],
  },
};