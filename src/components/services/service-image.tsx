import Image from "next/image";
import { CategoryIcon } from "@/components/services/category-icon";
import { cn } from "@/lib/utils";

type ServiceImageProps = {
  name: string;
  imageUrl: string | null;
  categorySlug: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Service photo, or a tinted category icon placeholder when there is no image. */
export function ServiceImage({
  name,
  imageUrl,
  categorySlug,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority,
}: ServiceImageProps) {
  return (
    <div className={cn("bg-primary/10 relative aspect-[16/10] overflow-hidden", className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          // Loaded straight from the admin-provided host; see next.config.ts.
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="text-primary flex h-full items-center justify-center">
          <CategoryIcon slug={categorySlug} className="size-12 opacity-80" />
        </div>
      )}
    </div>
  );
}
