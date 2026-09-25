import { SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableShellProps = {
  children: React.ReactNode;
  label: string;
  /** Below this width the table scrolls horizontally instead of squashing columns. */
  minWidth?: "sm" | "md";
};

/** White panel (LightPanel styling) holding a table that scrolls horizontally when narrow. */
export function TableShell({ children, label, minWidth = "md" }: TableShellProps) {
  return (
    <div className="admin-light bg-admin-light rounded-panel min-w-0 overflow-hidden p-2 sm:p-3">
      <div className="overflow-x-auto">
        <table
          className={cn("w-full text-sm", minWidth === "md" ? "min-w-[720px]" : "min-w-[540px]")}
          aria-label={label}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export const thClass =
  "text-muted-foreground border-border border-b px-4 py-3 text-left text-xs font-medium whitespace-nowrap";
export const tdClass = "border-border text-ink border-b px-4 py-3 align-middle";

export function rowClass(clickable: boolean) {
  return cn(
    "[&:last-child>td]:border-b-0",
    clickable &&
      "hover:bg-muted focus-visible:ring-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset",
  );
}

/** Empty state in a dark panel (lime icon on dark is fine; lime never appears on white). */
export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-admin-border bg-admin-panel rounded-panel flex flex-col items-center gap-3 border border-dashed px-6 py-14 text-center">
      <div className="bg-admin-panel-2 text-admin-accent rounded-full p-3">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-admin-text text-lg font-medium">{title}</h2>
      <p className="text-admin-muted max-w-sm text-sm">{description}</p>
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="admin-light bg-admin-light rounded-panel p-2 sm:p-3" aria-hidden="true">
      <div className="border-border flex gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="border-border flex gap-4 border-b px-4 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Loading state for list pages: pill tabs, filter bar and a table, all in theme colors. */
export function AdminPageSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <span className="sr-only">Loading...</span>
      <Skeleton className="bg-admin-panel h-11 w-80 max-w-full rounded-full" />
      <Skeleton className="bg-admin-panel rounded-panel h-[72px] w-full" />
      <TableSkeleton columns={columns} />
    </div>
  );
}
