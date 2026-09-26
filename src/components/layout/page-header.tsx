type PageHeaderProps = {
  /** Small label above the title, shown with a lime dot. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or links shown to the right (below on small screens). */
  actions?: React.ReactNode;
};

/** Standard page title block for public and customer pages. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-muted-foreground text-label mb-3 flex items-center gap-2 font-medium">
            <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-ink text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
