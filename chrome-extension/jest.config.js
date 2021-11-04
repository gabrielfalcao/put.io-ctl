const path = require("path");

module.exports = {
  displayName: {
    name: "putio-extension tests",
    color: "cyan",
  },
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
  verbose: true,
  moduleDirectories: [
    path.resolve(__dirname, "node_modules/"),
    path.resolve(__dirname, "src"),
  ],
  testTimeout: 10000,
  collectCoverage: true,
  resetMocks: true,

  coveragePathIgnorePatterns: [
    "/node_modules/",
    ".*__tests__.*",
    ".*__mocks__.*",
  ],
  rootDir: path.resolve(__dirname, "src"),
  //  testMatch: ["**/tests/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "putio/(.*)": path.resolve(__dirname, "src/js/$1"),
    "img/(.*)": path.resolve(__dirname, "src/img/$1"),
    "css/(.*)": path.resolve(__dirname, "src/css/$1"),
    "semantic-ui/(.*)": path.resolve(__dirname, "vendor/semantic-ui/$1"),
  },
};
