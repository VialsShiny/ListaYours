import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Responsive and type checks run against `next dev` on port 3100 with every API call mocked
 * (see e2e/fixtures.ts), so they need neither the API nor a database.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  outputDir: "./e2e/test-results",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices["Desktop Chrome"],
    locale: "fr-FR",
    trace: "off",
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { NEXT_PUBLIC_API_URL: "http://127.0.0.1:8999", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
