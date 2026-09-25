import { CalendarDays, MousePointerClick, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Choose a service",
    text: "Browse vetted cleaning, beauty, repair and tutoring services with clear, upfront prices.",
  },
  {
    icon: CalendarDays,
    title: "Pick a date and time",
    text: "Select a slot that suits you and add any notes for the professional.",
  },
  {
    icon: ShieldCheck,
    title: "Relax, it's booked",
    text: "We confirm your booking, and you can track or cancel it anytime from your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="bg-card border-border rounded-card relative border p-6">
          <span
            className="text-primary/15 absolute top-4 right-5 text-5xl font-bold"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <span className="bg-primary text-primary-foreground mb-4 flex size-11 items-center justify-center rounded-full">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h3 className="text-ink mb-1.5 font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{text}</p>
        </li>
      ))}
    </ol>
  );
}
