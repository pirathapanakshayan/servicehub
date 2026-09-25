import { z } from "zod";
import { BOOKING_STATUSES, isFutureSlot, isValidDateOnly, isValidSlot } from "@/lib/booking-rules";

const nameRule = z
  .string({ error: "Name is required" })
  .trim()
  .min(2, { error: "Name must be at least 2 characters" })
  .max(60, { error: "Name must be at most 60 characters" });

const passwordRule = z
  .string({ error: "Password is required" })
  .min(8, { error: "Password must be at least 8 characters" })
  .max(72, { error: "Password must be at most 72 characters" })
  .regex(/[A-Za-z]/, { error: "Password must contain at least one letter" })
  .regex(/[0-9]/, { error: "Password must contain at least one number" });

const phoneRule = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,18}$/, { error: "Enter a valid phone number" })
  .optional()
  .or(z.literal(""));

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

export const registerSchema = z
  .object({
    name: nameRule,
    email,
    password: passwordRule,
    confirmPassword: z.string({ error: "Please confirm your password" }),
    phone: phoneRule,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }),
  /** Set by the admin login page; non-admin accounts are rejected. */
  adminOnly: z.boolean().optional(),
});

export type LoginInput = z.input<typeof loginSchema>;

/** A same-origin path safe to redirect to after login (blocks open redirects). */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const SERVICE_SORTS = ["newest", "price_asc", "price_desc"] as const;
export type ServiceSort = (typeof SERVICE_SORTS)[number];

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

const optionalPrice = z
  .union([z.literal(""), z.coerce.number({ error: "Price must be a number" })])
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.number().min(0, { error: "Price cannot be negative" }).optional())
  .optional();

export const serviceQuerySchema = z
  .object({
    search: optionalText.pipe(z.string().max(100).optional()),
    categoryId: optionalText.pipe(z.uuid({ error: "Invalid category" }).optional()),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
    sort: z.enum(SERVICE_SORTS, { error: "Invalid sort option" }).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50, { error: "Limit cannot exceed 50" }).default(9),
    includeInactive: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .default(false),
    /** Admin only: filter by status (implies includeInactive). */
    status: z
      .string()
      .transform((v) => v || undefined)
      .pipe(z.enum(["ACTIVE", "INACTIVE"], { error: "Invalid status" }).optional())
      .optional(),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    error: "Minimum price cannot exceed maximum price",
    path: ["minPrice"],
  });

export type ServiceQuery = z.output<typeof serviceQuerySchema>;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Parses page search params leniently: any invalid field falls back to its default
 * instead of failing the whole page.
 */
export function parseSearchParams<T extends z.ZodType>(
  schema: T,
  params: SearchParams,
): z.output<T> {
  const input: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v !== undefined) input[key] = v;
  }
  const first = schema.safeParse(input);
  if (first.success) return first.data;
  for (const issue of first.error.issues) delete input[String(issue.path[0])];
  const second = schema.safeParse(input);
  return second.success ? second.data : schema.parse({});
}

export function parseServiceQuery(params: SearchParams) {
  return parseSearchParams(serviceQuerySchema, params);
}

export const serviceSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(3, { error: "Name must be at least 3 characters" })
    .max(100, { error: "Name must be at most 100 characters" }),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(10, { error: "Description must be at least 10 characters" })
    .max(2000, { error: "Description must be at most 2000 characters" }),
  price: z.coerce
    .number({ error: "Price must be a number" })
    .min(0, { error: "Price cannot be negative" })
    .max(99_999_999.99, { error: "Price is too large" })
    .multipleOf(0.01, { error: "Price can have at most 2 decimal places" }),
  durationMinutes: z.coerce
    .number({ error: "Duration must be a number" })
    .int({ error: "Duration must be a whole number of minutes" })
    .min(15, { error: "Duration must be at least 15 minutes" })
    .max(480, { error: "Duration must be at most 480 minutes" }),
  categoryId: z.uuid({ error: "Select a valid category" }),
  imageUrl: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Enter a valid image URL" })])
    .optional()
    .transform((v) => v || null),
  status: z
    .enum(["ACTIVE", "INACTIVE"], { error: "Status must be ACTIVE or INACTIVE" })
    .default("ACTIVE"),
});

export type ServiceInput = z.input<typeof serviceSchema>;
export type ServiceOutput = z.output<typeof serviceSchema>;

export const uuidParamSchema = z.uuid({ error: "Invalid id" });

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export const dateOnlySchema = z
  .string({ error: "Date is required" })
  .refine(isValidDateOnly, { error: "Date must be a valid date in YYYY-MM-DD format" });

export const bookingCreateSchema = z
  .object({
    serviceId: z.uuid({ error: "Select a valid service" }),
    bookingDate: dateOnlySchema,
    bookingTime: z
      .string({ error: "Time is required" })
      .refine(isValidSlot, { error: "Time must be a 30-minute slot between 08:00 and 18:00" }),
    notes: z
      .string()
      .trim()
      .max(500, { error: "Notes must be at most 500 characters" })
      .optional()
      .transform((v) => v || null),
  })
  .refine((d) => isFutureSlot(d.bookingDate, d.bookingTime), {
    error: "Please choose a date and time in the future",
    path: ["bookingTime"],
  });

export type BookingCreateInput = z.input<typeof bookingCreateSchema>;
export type BookingCreateOutput = z.output<typeof bookingCreateSchema>;

export const bookingStatusSchema = z.enum(BOOKING_STATUSES, { error: "Invalid booking status" });

export const bookingUpdateSchema = z.object({ status: bookingStatusSchema }).strict();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .pipe(dateOnlySchema.optional())
  .optional();

export const bookingQuerySchema = z
  .object({
    status: z
      .string()
      .transform((v) => v || undefined)
      .pipe(bookingStatusSchema.optional())
      .optional(),
    search: z
      .string()
      .trim()
      .max(100)
      .transform((v) => v || undefined)
      .optional(),
    dateFrom: optionalDate,
    dateTo: optionalDate,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50, { error: "Limit cannot exceed 50" }).default(10),
  })
  .refine((q) => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, {
    error: "dateFrom cannot be after dateTo",
    path: ["dateFrom"],
  });

export type BookingQuery = z.output<typeof bookingQuerySchema>;

export const slotsQuerySchema = z.object({ date: dateOnlySchema });

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileSchema = z.object({ name: nameRule, phone: phoneRule });
export type ProfileInput = z.input<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ error: "Current password is required" })
      .min(1, { error: "Current password is required" }),
    newPassword: passwordRule,
    confirmNewPassword: z.string({ error: "Please confirm your new password" }),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    error: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;

/** PUT /api/profile: any of name/phone, and optionally a password change. */
export const profileUpdateSchema = z
  .object({
    name: nameRule.optional(),
    phone: phoneRule,
    currentPassword: z.string().optional(),
    newPassword: passwordRule.optional(),
  })
  .strict()
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    error: "Current password is required to set a new password",
    path: ["currentPassword"],
  })
  .refine((d) => d.name !== undefined || d.phone !== undefined || d.newPassword !== undefined, {
    error: "Nothing to update",
  });

// ---------------------------------------------------------------------------
// Admin: users
// ---------------------------------------------------------------------------

export const userQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || undefined)
    .optional(),
  isActive: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.enum(["true", "false"], { error: "isActive must be true or false" }).optional())
    .transform((v) => (v === undefined ? undefined : v === "true"))
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50, { error: "Limit cannot exceed 50" }).default(10),
});

export type UserQuery = z.output<typeof userQuerySchema>;

export const userUpdateSchema = z
  .object({ isActive: z.boolean({ error: "isActive must be true or false" }) })
  .strict();
