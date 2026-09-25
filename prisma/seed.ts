import { BookingStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Cleaning", slug: "cleaning" },
  { name: "Beauty & Wellness", slug: "beauty-wellness" },
  { name: "Home Repairs", slug: "home-repairs" },
  { name: "Tutoring", slug: "tutoring" },
] as const;

type CategorySlug = (typeof categories)[number]["slug"];

const services: {
  category: CategorySlug;
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
}[] = [
  {
    category: "cleaning",
    name: "Standard Home Cleaning",
    description:
      "A thorough clean of living areas, bedrooms, kitchen and bathrooms, including dusting, vacuuming, mopping and surface sanitising. Ideal for regular upkeep of homes up to 3 bedrooms.",
    price: "4500.00",
    durationMinutes: 180,
  },
  {
    category: "cleaning",
    name: "Deep Kitchen Cleaning",
    description:
      "Degreasing of cabinets, hob, hood and tiles, inside-oven and fridge cleaning, and sink descaling. Our team brings all equipment and eco-friendly detergents.",
    price: "6500.00",
    durationMinutes: 240,
  },
  {
    category: "cleaning",
    name: "Sofa & Carpet Shampooing",
    description:
      "Hot-water extraction cleaning for fabric sofas and carpets that lifts stains, dust mites and odours. Price covers one 3-seater sofa and one medium carpet.",
    price: "8000.00",
    durationMinutes: 150,
  },
  {
    category: "beauty-wellness",
    name: "Classic Haircut & Styling",
    description:
      "A consultation, wash, precision cut and blow-dry styling at your home by an experienced stylist. Suitable for all hair types.",
    price: "2500.00",
    durationMinutes: 60,
  },
  {
    category: "beauty-wellness",
    name: "Full Body Relaxation Massage",
    description:
      "A 90-minute aromatherapy massage using warm herbal oils to ease muscle tension and improve circulation. The therapist brings a portable massage table and fresh linen.",
    price: "9500.00",
    durationMinutes: 90,
  },
  {
    category: "beauty-wellness",
    name: "Bridal Makeup Package",
    description:
      "Complete bridal look including skin prep, HD makeup, lashes and hairstyling, plus a trial session scheduled before the wedding day.",
    price: "15000.00",
    durationMinutes: 180,
  },
  {
    category: "home-repairs",
    name: "Plumbing Inspection & Repair",
    description:
      "Diagnosis and repair of leaking taps, blocked drains, faulty cisterns and minor pipe work. Price includes the first hour of labour; parts are billed separately.",
    price: "3500.00",
    durationMinutes: 60,
  },
  {
    category: "home-repairs",
    name: "Electrical Wiring Check",
    description:
      "A certified electrician inspects your distribution board, sockets, switches and earthing, fixes minor faults and gives a written safety report.",
    price: "5000.00",
    durationMinutes: 120,
  },
  {
    category: "home-repairs",
    name: "Air Conditioner Servicing",
    description:
      "Full service of one split-type AC unit: filter and coil cleaning, drain line flushing, gas pressure check and performance test.",
    price: "4000.00",
    durationMinutes: 90,
  },
  {
    category: "tutoring",
    name: "O/L Mathematics Tutoring",
    description:
      "One-to-one home tutoring for G.C.E. Ordinary Level Mathematics covering theory, past papers and exam techniques, tailored to the student's pace.",
    price: "2000.00",
    durationMinutes: 90,
  },
  {
    category: "tutoring",
    name: "Spoken English Coaching",
    description:
      "Interactive conversation sessions focused on fluency, pronunciation and confidence for students and working professionals.",
    price: "1500.00",
    durationMinutes: 60,
  },
  {
    category: "tutoring",
    name: "A/L Physics Revision Class",
    description:
      "Intensive revision for G.C.E. Advanced Level Physics with worked problems, concept mapping and timed practice on past-paper questions.",
    price: "3000.00",
    durationMinutes: 120,
  },
];

/** Returns a UTC-midnight Date `offsetDays` from today, suitable for a @db.Date column. */
function dayOffset(offsetDays: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const [adminHash, customerHash] = await Promise.all([
    bcrypt.hash("Admin@123", 12),
    bcrypt.hash("Customer@123", 12),
  ]);

  await prisma.user.create({
    data: {
      name: "ServiceHub Admin",
      email: "admin@servicehub.com",
      passwordHash: adminHash,
      phone: "+94112345678",
      role: Role.ADMIN,
    },
  });

  const customerData = [
    { name: "Nimali Perera", email: "nimali@example.com", phone: "+94771234567" },
    { name: "Kasun Fernando", email: "kasun@example.com", phone: "+94712345678" },
    { name: "Tharushi Silva", email: "tharushi@example.com", phone: "+94761234567" },
  ];
  const customers = await Promise.all(
    customerData.map((c) =>
      prisma.user.create({ data: { ...c, passwordHash: customerHash, role: Role.CUSTOMER } }),
    ),
  );

  console.log("Creating categories and services...");
  const categoryBySlug = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    categoryBySlug.set(c.slug, created.id);
  }

  const createdServices = [];
  for (const s of services) {
    const { category, ...rest } = s;
    createdServices.push(
      await prisma.service.create({
        data: { ...rest, categoryId: categoryBySlug.get(category)! },
      }),
    );
  }

  console.log("Creating bookings...");
  // [customerIndex, serviceIndex, dayOffset, time, status, notes]
  const bookingPlan: [number, number, number, string, BookingStatus, string | null][] = [
    [0, 0, -30, "09:00", BookingStatus.COMPLETED, "Please bring your own ladder."],
    [0, 4, -14, "16:00", BookingStatus.COMPLETED, null],
    [1, 6, -21, "10:30", BookingStatus.COMPLETED, "Kitchen sink is leaking under the cabinet."],
    [2, 9, -7, "15:00", BookingStatus.COMPLETED, "Focus on algebra and geometry."],
    [1, 3, -10, "11:00", BookingStatus.CANCELLED, null],
    [2, 8, 5, "13:00", BookingStatus.CANCELLED, "Rescheduling due to travel."],
    [0, 1, 3, "08:30", BookingStatus.CONFIRMED, null],
    [1, 7, 6, "14:00", BookingStatus.CONFIRMED, "Old house, wiring is about 20 years old."],
    [2, 10, 2, "18:00", BookingStatus.CONFIRMED, null],
    [0, 5, 45, "08:00", BookingStatus.PENDING, "Wedding at 10 AM, trial needed next week."],
    [1, 2, 9, "10:00", BookingStatus.PENDING, "Grey fabric sofa with a coffee stain."],
    [2, 11, 12, "16:30", BookingStatus.PENDING, null],
  ];

  for (const [i, [ci, si, offset, time, status, notes]] of bookingPlan.entries()) {
    const service = createdServices[si];
    // Spread creation times: past bookings were made a few days before they happened,
    // future ones at some point in the last two weeks.
    const createdOffset = offset < 0 ? offset - 3 - (i % 4) : -(i % 13);
    const createdAt = new Date(dayOffset(createdOffset).getTime() + (9 * 60 + i * 37) * 60_000);
    await prisma.booking.create({
      data: {
        createdAt,
        userId: customers[ci].id,
        serviceId: service.id,
        bookingDate: dayOffset(offset),
        bookingTime: time,
        status,
        totalPrice: service.price,
        notes,
      },
    });
  }

  console.log(
    `Seeded 1 admin, ${customers.length} customers, ${categories.length} categories, ${createdServices.length} services, ${bookingPlan.length} bookings.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
