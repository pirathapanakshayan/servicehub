import { Clock } from "lucide-react";
import Link from "next/link";
import { ServiceImage } from "@/components/services/service-image";
import { formatDuration, formatPrice } from "@/lib/format";
import type { ServiceDTO } from "@/lib/services";

/** Service card that lifts on hover and reveals a rotating lime gradient border. */
export function ServiceCard({ service }: { service: ServiceDTO }) {
  return (
    <article className="group rounded-card relative h-full overflow-hidden p-px transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none">
      <span aria-hidden="true" className="bg-border absolute inset-0" />
      <span
        aria-hidden="true"
        className="group-hover:animate-spin-slow absolute inset-[-60%] opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0 65%, var(--brand-accent) 85%, transparent 100%)",
        }}
      />
      <div className="bg-card relative flex h-full flex-col overflow-hidden rounded-[23px]">
        <div className="relative">
          <ServiceImage
            name={service.name}
            imageUrl={service.imageUrl}
            categorySlug={service.category.slug}
            sizes="(min-width: 1200px) 380px, (min-width: 768px) 33vw, 100vw"
          />
          <span className="bg-background/80 text-foreground absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur">
            {service.category.name}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <h3 className="text-foreground text-h3 font-medium">
            <Link href={`/services/${service.id}`} className="after:absolute after:inset-0">
              {service.name}
            </Link>
          </h3>
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="text-foreground font-semibold">{formatPrice(service.price)}</span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Clock className="size-4" aria-hidden="true" />
              {formatDuration(service.durationMinutes)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
