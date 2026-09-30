import { defineConfig } from "@playwright/test";
import workshop from "./playwright.config.js";

const baseURL = "http://127.0.0.1:4186";

export default defineConfig({
  ...workshop,
  testDir: "./test/site",
  use: { ...workshop.use, baseURL },
  webServer: {
    command: "npm run build:pages && node scripts/serve-dist.js 4186 site",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
