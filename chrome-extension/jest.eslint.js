const path = require("path");

const jestConfig = {
  runner: "jest-runner-eslint",
  displayName: "lint",
  rootDir: path.join(__dirname),
  cacheDirectory: path.join(__dirname, ".caches/jest-runner-eslint"),
  testMatch: [
    "<rootDir>/src/**/*.js(on)?",
    "<rootDir>/tools/**/*.js(on)?",
    "^(jest|babel|.eslint)*.js(on)?",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/lib/",
    "/dist/",
    "/build/",
    "/.staging/",
    "/.caches/",
    "/coverage/",
    "/vendor/",
    "package-lock.json",
    "yarn.lock",
  ],
  haste: {
    computeSha1: true,
    throwOnModuleCollision: false,
  },
};

module.exports = jestConfig;
