import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Too short", color: "bg-danger" },
  { label: "Weak", color: "bg-danger" },
  { label: "Fair", color: "bg-warning" },
  { label: "Good", color: "bg-primary" },
  { label: "Strong", color: "bg-primary" },
];

/** 0–4 score. Guidance only: the zod schema still decides what is accepted. */
export function passwordScore(password: string): number {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  return score;
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const level = LEVELS[score]!;
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none",
              i <= Math.max(score, 1) ? level.color : "bg-surface-2",
            )}
          />
        ))}
      </div>
      <p className="text-muted-foreground w-16 text-right text-xs" aria-live="polite">
        {level.label}
      </p>
    </div>
  );
}
