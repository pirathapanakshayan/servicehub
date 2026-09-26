import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** Small label above the title, shown with a lime dot. */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned action (e.g. a "View all" button). */
  action?: React.ReactNode;
  /** Heading level; sections under the page <h1> use h2. */
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
};

const TITLE_SIZE = { h1: "text-h1", h2: "text-h2", h3: "text-h3" } as const;

/** Eyebrow + title (+ description) with an optional action on the right. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  as: Heading = "h2",
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl space-y-3">
        {eyebrow && (
          <p className="text-muted-foreground flex items-center gap-2 text-label font-medium">
            <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <Heading id={id} className={cn("text-foreground font-medium", TITLE_SIZE[Heading])}>
          {title}
        </Heading>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
