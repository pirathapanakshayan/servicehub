import { cn } from "@/lib/utils";

type LightPanelProps = {
  title?: React.ReactNode;
  /** Right-aligned header content (links, buttons). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Heading level for the title. */
  as?: "h2" | "h3";
};

/**
 * White panel for lists and tables (radius 24px). `.light-surface` flips the tokens to light,
 * so shared components inside it render dark-on-white; lime never appears as text here.
 */
export function LightPanel({ title, action, children, className, as: Heading = "h2" }: LightPanelProps) {
  return (
    <section className={cn("light-surface bg-light rounded-card min-w-0 p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <Heading className="text-lg font-medium">{title}</Heading>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
