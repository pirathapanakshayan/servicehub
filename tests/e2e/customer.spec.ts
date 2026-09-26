import { expect, test } from "@playwright/test";
import { businessDay, expectToast, pickCalendarDay } from "./helpers";

const SERVICE = "Classic Haircut & Styling";

test("customer registers, books a slot, sees it in My Bookings and cancels it", async ({
  page,
}) => {
  const email = `e2e.customer.${Date.now()}@example.com`;

  await test.step("register", async () => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E Customer");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("E2ePass123");
    await page.getByLabel("Confirm password").fill("E2ePass123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E");
  });

  await test.step("browse and search services", async () => {
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Services" })
      .click();
    await expect(page.getByRole("heading", { level: 1, name: /Find your service/ })).toBeVisible();
    await page.getByLabel("Search").fill("Haircut");
    await expect(page).toHaveURL(/search=Haircut/);
    await expect(page.getByRole("heading", { level: 3, name: SERVICE })).toBeVisible();
    await page.getByRole("link", { name: SERVICE }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: SERVICE })).toBeVisible();
    await expect(page.getByText("LKR 2,500.00").first()).toBeVisible();
  });

  let bookedTime = "";
  await test.step("book a slot", async () => {
    await pickCalendarDay(page, businessDay(3));
    const slots = page.getByRole("group", { name: "Available times" });
    await expect(slots).toBeVisible();
    const slot = slots.getByRole("button").first();
    bookedTime = (await slot.textContent())!.trim();
    await slot.click();
    await expect(slot).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel(/Notes for the provider/).fill("Booked by the E2E test");
    await page.getByRole("button", { name: "Confirm booking" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(SERVICE);
    await expect(dialog).toContainText(bookedTime);
    await dialog.getByRole("button", { name: "Confirm booking" }).click();

    // The toast fires with the success state; check it first (a cold dev compile can outlast it).
    await expectToast(page, "Booking requested");
    await page.getByRole("link", { name: "View booking" }).click();
    await expect(page).toHaveURL(/\/my-bookings\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: SERVICE })).toBeVisible();
  });

  await test.step("see it in My Bookings", async () => {
    await page.goto("/my-bookings?tab=upcoming");
    const card = page.getByRole("link").filter({ hasText: SERVICE });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Pending");
    await expect(card).toContainText(bookedTime);
    await card.click();
    await expect(page).toHaveURL(/\/my-bookings\/[0-9a-f-]{36}$/);
  });

  await test.step("cancel it", async () => {
    await page.getByRole("button", { name: "Cancel booking" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Cancel this booking?");
    await dialog.getByRole("button", { name: "Yes, cancel" }).click();
    await expectToast(page, "Booking cancelled");
    await expect(page.getByRole("button", { name: "Cancel booking" })).toHaveCount(0);
    await expect(
      page.getByRole("main").getByText("Cancelled", { exact: true }).first(),
    ).toBeVisible();

    await page.goto("/my-bookings?tab=cancelled");
    await expect(page.getByRole("link").filter({ hasText: SERVICE })).toBeVisible();
  });
});
