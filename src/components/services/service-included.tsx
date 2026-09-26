import { Check } from "lucide-react";

const INCLUDED: Record<string, string[]> = {
  cleaning: [
    "Vetted, insured cleaning professional",
    "Eco-friendly supplies and equipment",
    "Kitchen, bathroom and living areas",
    "Final walkthrough with you",
  ],
  "beauty-wellness": [
    "Certified stylist or therapist",
    "Premium, hygienic products",
    "Consultation before we start",
    "Aftercare tips",
  ],
  "home-repairs": [
    "Qualified technician",
    "Diagnosis and standard tools",
    "Clean-up after the job",
    "30-day workmanship guarantee",
  ],
  tutoring: [
    "Experienced, background-checked tutor",
    "Session plan tailored to the student",
    "Practice material",
    "Progress notes after each session",
  ],
};

const DEFAULT_INCLUDED = [
  "Vetted, background-checked professional",
  "Clear, upfront price with no hidden fees",
  "Free cancellation before the booking is completed",
];

/** "What's included" checklist for a service, by category. */
export function ServiceIncluded({ categorySlug }: { categorySlug: string }) {
  const items = INCLUDED[categorySlug] ?? DEFAULT_INCLUDED;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="bg-card shadow-surface rounded-inner flex items-start gap-3 p-4">
          <span className="bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="text-foreground text-sm">{item}</span>
        </li>
      ))}
    </ul>
  );
}
