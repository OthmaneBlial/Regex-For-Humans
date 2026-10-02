import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("example selections and scroll positions follow their identities through row changes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const viewport = page.viewportSize();
  const view = (input) => ({
    value: input.value,
    height: input.style.height,
    selection: [input.selectionStart, input.selectionEnd, input.selectionDirection],
    top: input.scrollTop,
    left: input.scrollLeft,
    description: input.getAttribute("aria-describedby"),
  });
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    await page.goto("/");
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.locator("#rules-input").fill('start\n"Record: "\nany text\nend');
    await page.locator("#dot-all").check();
    const fields = page.locator("#test-list textarea");
    const snapshots = [];
    for (const [index, prefix] of ["Record", "Other"].entries()) {
      const text = Array.from(
        { length: 25 },
        (_, line) => `${prefix}: ${String(line).padStart(2, "0")} 😀 sample`,
      ).join("\n");
      const field = fields.nth(index);
      await field.fill(text);
      await expect(page.locator("#test-summary")).toHaveText(/4 of 4 examples behave as expected/u);
      await field.evaluate((input, index) => {
        input.style.height = `${100 + index * 40}px`;
        const line = 4 + index * 2;
        const start = input.value.split("\n").slice(0, line).join("\n").length + 1;
        input.setSelectionRange(start + 2, start + 8, index === 0 ? "backward" : "forward");
        input.scrollTop = line * Number.parseFloat(getComputedStyle(input).lineHeight);
      }, index);
      const snapshot = await field.evaluate(view);
      expect(snapshot.top).toBeGreaterThan(0);
      expect(snapshot.selection[0]).toBeLessThan(snapshot.selection[1]);
      snapshots.push(snapshot);
    }
    const pattern = await page.locator("#regex-output").textContent();
    await page.locator("#add-example").click();
    await expect(fields).toHaveCount(5);
    await expect(fields.last()).toBeFocused();
    for (const [index, snapshot] of snapshots.entries())
      expect(await fields.nth(index).evaluate(view)).toEqual(snapshot);
    await page.locator("#test-list select").last().selectOption("false");
    await expect(page.locator("#test-summary")).toHaveText(/5 of 5 examples behave as expected/u);
    await page.getByRole("button", { name: "Remove example 1", exact: true }).click();
    await expect(fields).toHaveCount(4);
    await expect(fields.first()).toBeFocused();
    await expect(fields.first()).toHaveAccessibleName("Example 1 string");
    expect(await fields.first().evaluate(view)).toEqual(snapshots[1]);
    await expect(page.locator("#test-summary")).toHaveText(/4 of 4 examples behave as expected/u);
    const [start, end] = snapshots[1].selection;
    await page.keyboard.insertText("CHANGED");
    await expect(fields.first()).toHaveValue(
      `${snapshots[1].value.slice(0, start)}CHANGED${snapshots[1].value.slice(end)}`,
    );
    await expect(page.locator("#test-summary")).toHaveText(/4 of 4 examples behave as expected/u);
    const edited = await fields.first().evaluate(view);
    await page.getByRole("button", { name: "Remove example 3", exact: true }).click();
    expect(await fields.first().evaluate(view)).toEqual(edited);
    await page.locator("#add-example").click();
    await expect(fields.last()).toBeFocused();
    expect(
      await fields.last().evaluate((input) => ({
        height: input.style.height,
        top: input.scrollTop,
        selection: [input.selectionStart, input.selectionEnd],
      })),
    ).toEqual({ height: "", top: 0, selection: [0, 0] });
    await expect(page.locator("#regex-output")).toHaveText(pattern);
    await page.locator("#test-list select").last().selectOption("false");
    await expect(page.locator("#test-summary")).toHaveText(/4 of 4 examples behave as expected/u);
    await fields.nth(1).fill(snapshots[1].value);
    await expect(page.locator("#test-summary")).toHaveText(/4 of 4 examples behave as expected/u);
    await fields.nth(1).evaluate((input) => {
      input.style.height = "140px";
      input.setSelectionRange(input.value.length, input.value.length);
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await fields.nth(1).evaluate((input) => {
      input.scrollTop = 62;
    });
    const offscreenCaret = await fields.nth(1).evaluate(view);
    expect(offscreenCaret.top).toBe(62);
    expect(offscreenCaret.selection.slice(0, 2)).toEqual([
      offscreenCaret.value.length,
      offscreenCaret.value.length,
    ]);
    await page.getByRole("button", { name: "Remove example 1", exact: true }).click();
    await expect(fields).toHaveCount(3);
    await expect(fields.first()).toBeFocused();
    await expect(fields.first()).toBeInViewport();
    expect(await fields.first().evaluate(view)).toEqual(offscreenCaret);
    await expect(page.locator("#test-summary")).toHaveText(/3 of 3 examples behave as expected/u);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('[data-scenario="time-shape"]').click();
    await expect(page.locator("#test-summary")).toHaveText("13 of 13 examples behave as expected");
    expect(
      await fields.evaluateAll((inputs) =>
        inputs.every((input) => input.style.height === "" && input.scrollTop === 0),
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  }
});
