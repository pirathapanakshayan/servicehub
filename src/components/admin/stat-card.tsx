import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  subLabel?: React.ReactNode;
  /** 0..1 fills a lime bar on a muted track. */
  progress?: number;
  /** Accessible description of the progress bar, e.g. "3 of 12 bookings". */
  progressLabel?: string;
  footer?: React.ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  subLabel,
  progress,
  progressLabel,
  footer,
  className,
}: StatCardProps) {
  const pct =
    progress === undefined ? undefined : Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div
      className={cn(
        "bg-admin-bg border-admin-border rounded-inner flex min-w-0 flex-col gap-3 border p-4 sm:p-5",
        className,
      )}
    >
      <p className="text-admin-muted text-[13px]">{label}</p>
      <p className="text-admin-text text-[30px] leading-none font-medium tracking-tight">{value}</p>
      {subLabel && <p className="text-admin-muted text-[13px]">{subLabel}</p>}
      {pct !== undefined && (
        <div
          role="progressbar"
          aria-label={progressLabel ?? label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="bg-admin-panel-2 h-1.5 overflow-hidden rounded-full"
        >
          <div className="bg-admin-accent h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
      {footer && <div className="mt-auto pt-1">{footer}</div>}
    </div>
  );
}
