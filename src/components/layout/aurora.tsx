/** Hero backdrop: three blurred gradients drifting on CSS keyframes plus a faint grain. */
export function Aurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-aurora-a absolute -top-1/4 -left-1/4 size-[70vmax] rounded-full bg-[radial-gradient(circle,var(--brand-accent)_0%,transparent_60%)] opacity-[0.14] blur-3xl will-change-transform" />
      <div className="animate-aurora-b absolute -top-1/3 -right-1/4 size-[65vmax] rounded-full bg-[radial-gradient(circle,var(--brand-aurora-teal)_0%,transparent_60%)] opacity-[0.16] blur-3xl will-change-transform" />
      <div className="animate-aurora-c absolute -bottom-1/2 left-1/4 size-[60vmax] rounded-full bg-[radial-gradient(circle,var(--brand-aurora-violet)_0%,transparent_60%)] opacity-[0.18] blur-3xl will-change-transform" />
      <svg className="absolute inset-0 size-full opacity-[0.04]">
        <filter id="hero-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>
      <div className="from-background absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent" />
    </div>
  );
}
