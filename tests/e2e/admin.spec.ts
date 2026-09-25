import { expect, test } from "@playwright/test";
import { expectToast, loginAsAdmin } from "./helpers";

test("admin logs in, confirms a pending booking, then marks it completed", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();

  // Rows are labelled "View booking: <service> for <customer>".
  let rowName = "";
  await test.step("confirm a pending booking", async () => {
    await page.goto("/admin/bookings?status=PENDING");
    const row = page
      .getByRole("row")
      .filter({ has: page.getByRole("combobox") })
      .first();
    rowName = (await row.getAttribute("aria-label"))!;
    const status = row.getByRole("combobox");
    await expect(status).toHaveValue("PENDING");
    // Only valid next statuses are offered.
    await expect(status.locator("option")).toHaveText([
      "Pending",
      "Mark confirmed",
      "Cancel booking",
    ]);

    await status.selectOption("CONFIRMED");
    await expectToast(page, "Booking marked confirmed");
  });

  await test.step("mark it completed", async () => {
    await page.goto("/admin/bookings?status=CONFIRMED");
    const row = page.getByRole("row", { name: rowName });
    const status = row.getByRole("combobox");
    await expect(status).toHaveValue("CONFIRMED");
    await expect(status.locator("option")).toHaveText([
      "Confirmed",
      "Mark completed",
      "Cancel booking",
    ]);

    await status.selectOption("COMPLETED");
    await expectToast(page, "Booking marked completed");
    // The list is filtered to CONFIRMED, so the row drops out once it's completed.
    await expect(page.getByRole("row", { name: rowName })).toHaveCount(0);

    await page.goto("/admin/bookings?status=COMPLETED");
    const completed = page.getByRole("row", { name: rowName }).getByRole("combobox");
    await expect(completed).toHaveValue("COMPLETED");
    // COMPLETED is final: nothing more to choose.
    await expect(completed).toBeDisabled();
  });

  await test.step("details sheet shows the new status", async () => {
    await page.getByRole("row", { name: rowName }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Completed", { exact: true }).first()).toBeVisible();
  });
});
