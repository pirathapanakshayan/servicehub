import type { LucideIcon } from "lucide-react";

type StatCardProps = { label: string; value: string; icon: LucideIcon; hint?: string };

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="bg-card border-border rounded-card border p-5">
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        {label}
        <span className="bg-primary/10 text-primary rounded-full p-2">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="text-ink mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}
