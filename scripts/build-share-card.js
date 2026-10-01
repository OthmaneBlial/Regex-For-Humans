import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const svg = await readFile(new URL("../site/assets/social-card.svg", import.meta.url), "utf8");
const browser = await chromium.launch({ channel: process.env.CI ? "chromium" : "chrome" });

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}svg{display:block}</style>${svg}`,
  );
  const card = page.locator("svg");
  const bounds = await card.boundingBox();
  if (bounds?.width !== 1200 || bounds.height !== 630) {
    throw new Error("The social card must render at exactly 1200 × 630 pixels.");
  }
  await writeFile(
    new URL("../site/assets/social-card.png", import.meta.url),
    await card.screenshot(),
  );
  process.stdout.write("Built site/assets/social-card.png at 1200 × 630.\n");
} finally {
  await browser.close();
}
