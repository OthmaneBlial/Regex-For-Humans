import { defineConfig } from "@playwright/test";
import workshop from "./playwright.config.js";

export default defineConfig({
  testDir: "./test/compat",
  fullyParallel: true,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: workshop.use.baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "firefox", use: { browserName: "firefox", viewport: { width: 1280, height: 800 } } },
    { name: "webkit", use: { browserName: "webkit", viewport: { width: 1280, height: 800 } } },
  ],
  webServer: workshop.webServer,
});
