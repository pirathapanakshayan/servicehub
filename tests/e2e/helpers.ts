import { expect, type Page } from "@playwright/test";
import { format } from "date-fns";

/** A local Date for `days` from today in the business time zone (Asia/Colombo). */
export function businessDay(days: number) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  const [y, m, d] = today.split("-").map(Number);
  return new Date(y!, m! - 1, d! + days);
}

/** Clicks a day in the booking calendar, paging forward a month if needed. */
export async function pickCalendarDay(page: Page, date: Date) {
  // react-day-picker labels days like "Saturday, September 26th, 2026".
  const day = page.getByRole("button", { name: format(date, "EEEE, MMMM do, yyyy") });
  for (let i = 0; i < 2 && !(await day.isVisible()); i++) {
    await page.getByRole("button", { name: /next month/i }).click();
  }
  await day.click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@servicehub.com");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: "Log in to admin" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}
