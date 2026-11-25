/** Dependabot writes release-note bodies with long lines; its headers still follow the convention. */
const isDependabot = (message) => /^Signed-off-by: dependabot\[bot\]/m.test(message);

module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [isDependabot],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "build", "ci", "chore", "perf"],
    ],
    "header-max-length": [2, "always", 100],
  },
};
