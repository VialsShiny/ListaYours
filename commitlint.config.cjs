module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "build", "ci", "chore", "perf"],
    ],
    "header-max-length": [2, "always", 100],
  },
};
