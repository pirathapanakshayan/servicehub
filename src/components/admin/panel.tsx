import { cn } from "@/lib/utils";

type PanelProps = {
  title?: React.ReactNode;
  /** Right-aligned header content (links, buttons). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Heading level for the title; panels sit under the page <h1>. */
  as?: "h2" | "h3";
};

function PanelHeader({ title, action, as: Heading = "h2" }: Omit<PanelProps, "children">) {
  if (!title && !action) return null;
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      {title && <Heading className="text-lg font-medium">{title}</Heading>}
      {action}
    </div>
  );
}

/** Dark panel (radius 24px). `min-w-0` lets wide content scroll inside grid cells. */
export function Panel({ title, action, children, className, as }: PanelProps) {
  return (
    <section
      className={cn(
        "bg-admin-panel border-admin-border text-admin-text rounded-panel min-w-0 border p-5 sm:p-6",
        className,
      )}
    >
      <PanelHeader title={title} action={action} as={as} />
      {children}
    </section>
  );
}

/** White panel for lists and tables. Re-scopes tokens to light (see .admin-light). */
export function LightPanel({ title, action, children, className, as }: PanelProps) {
  return (
    <section
      className={cn("admin-light bg-admin-light rounded-panel min-w-0 p-5 sm:p-6", className)}
    >
      <PanelHeader title={title} action={action} as={as} />
      {children}
    </section>
  );
}
