import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL } from "./e2e/support/environment";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/.report", open: "never" }],
  ],
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "world", testMatch: /world\.setup\.ts/ },
    {
      name: "roles",
      testMatch: /.*\.e2e\.ts/,
      dependencies: ["world"],
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: E2E_BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
