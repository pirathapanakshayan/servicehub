type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or links shown to the right (below on small screens). */
  actions?: React.ReactNode;
};

/** Standard page title block for public and customer pages. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-ink text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
