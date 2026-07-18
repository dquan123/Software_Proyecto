module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  collectCoverageFrom: [
    "app.js",
    "controllers/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "!index.js",
  ],
  coverageDirectory: "coverage",
};
