import { GraduationCap, Scissors, Sparkles, SprayCan, Wrench, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  cleaning: SprayCan,
  "beauty-wellness": Scissors,
  "home-repairs": Wrench,
  tutoring: GraduationCap,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return ICONS[slug] ?? Sparkles;
}

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = getCategoryIcon(slug);
  return <Icon className={className} aria-hidden="true" />;
}
