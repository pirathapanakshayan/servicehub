import { initials } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

const PALETTE = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
  "var(--avatar-6)",
];

/** Same name, same color: a small string hash picks from the avatar palette. */
function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const SIZES = { sm: "size-8 text-[11px]", md: "size-10 text-xs", lg: "size-11 text-sm" } as const;

type InitialsAvatarProps = {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Hide from assistive tech when the name is already shown next to it. */
  decorative?: boolean;
};

/** Colored circle with initials. Never loads remote photos. */
export function InitialsAvatar({ name, size = "md", className, decorative }: InitialsAvatarProps) {
  return (
    <span
      className={cn(
        "text-admin-accent-ink inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: colorFor(name) }}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      {initials(name)}
    </span>
  );
}

type AvatarStackProps = { names: string[]; max?: number; size?: keyof typeof SIZES };

/** Overlapping avatars with a ring in the surrounding panel color, plus a "+N" overflow. */
export function AvatarStack({ names, max = 4, size = "sm" }: AvatarStackProps) {
  if (names.length === 0) return null;
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center" role="group" aria-label={names.join(", ")}>
      {shown.map((name, i) => (
        <InitialsAvatar
          key={`${name}-${i}`}
          name={name}
          size={size}
          decorative
          className={cn("ring-2 ring-white", i > 0 && "-ml-2")}
        />
      ))}
      {extra > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "bg-admin-panel-2 text-admin-text -ml-2 inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-white",
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
