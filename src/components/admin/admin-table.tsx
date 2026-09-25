import { SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Card-wrapped table that scrolls horizontally on small screens. */
type TableShellProps = {
  children: React.ReactNode;
  label: string;
  /** Below this width the table scrolls horizontally instead of squashing columns. */
  minWidth?: "sm" | "md";
};

export function TableShell({ children, label, minWidth = "md" }: TableShellProps) {
  return (
    <div className="bg-card border-border rounded-card overflow-hidden border">
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
  "text-muted-foreground bg-muted/50 border-border border-b px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap uppercase";
export const tdClass = "border-border border-b px-4 py-3 align-middle";

export function rowClass(clickable: boolean) {
  return cn(
    "[&:last-child>td]:border-b-0",
    clickable &&
      "hover:bg-muted/40 focus-visible:ring-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset",
  );
}

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
    <div className="border-border bg-card rounded-card flex flex-col items-center gap-3 border border-dashed px-6 py-14 text-center">
      <div className="bg-primary/10 text-primary rounded-full p-3">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-ink text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card border-border rounded-card overflow-hidden border" aria-hidden="true">
      <div className="bg-muted/50 border-border flex gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
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

export function AdminPageSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <span className="sr-only">Loading...</span>
      <div className="flex justify-between gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="rounded-card h-[74px] w-full" />
      <TableSkeleton columns={columns} />
    </div>
  );
}
