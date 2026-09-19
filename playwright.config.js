import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4174";
const channel = process.env.CI ? "chromium" : "chrome";

export default defineConfig({
  testDir: "./test/browser",
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    channel,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: "npm run build && node scripts/serve-dist.js 4174",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
