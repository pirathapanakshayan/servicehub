import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ServiceImage } from "@/components/services/service-image";
import { formatDuration, formatPrice } from "@/lib/format";
import type { ServiceDTO } from "@/lib/services";

export function ServiceCard({ service }: { service: ServiceDTO }) {
  return (
    <article className="bg-card border-border rounded-card flex flex-col overflow-hidden border shadow-xs transition-shadow hover:shadow-md">
      <ServiceImage
        name={service.name}
        imageUrl={service.imageUrl}
        categorySlug={service.category.slug}
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Badge variant="secondary" className="w-fit">
          {service.category.name}
        </Badge>
        <div className="space-y-1.5">
          <h3 className="text-ink text-lg leading-snug font-semibold">
            <Link href={`/services/${service.id}`} className="hover:text-primary">
              {service.name}
            </Link>
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{service.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-ink font-semibold">{formatPrice(service.price)}</span>
          <span className="text-muted-foreground flex items-center gap-1 text-sm">
            <Clock className="size-4" aria-hidden="true" />
            {formatDuration(service.durationMinutes)}
          </span>
        </div>
        <Link
          href={`/services/${service.id}`}
          className={buttonVariants({ variant: "outline", className: "h-10 w-full" })}
        >
          View details
        </Link>
      </div>
    </article>
  );
}
