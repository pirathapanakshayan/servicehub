import { Clock, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { BookingPanel } from "@/components/bookings/booking-panel";
import { CategoryIcon } from "@/components/services/category-icon";
import { ServiceGrid } from "@/components/services/service-grid";
import { ServiceImage } from "@/components/services/service-image";
import { ServiceIncluded } from "@/components/services/service-included";
import { getSession } from "@/lib/auth";
import { formatDuration, formatPrice } from "@/lib/format";
import { getRelatedServices, getService } from "@/lib/services";
import { uuidParamSchema } from "@/lib/validators";

type ServicePageProps = { params: Promise<{ id: string }> };

// Deduplicated between generateMetadata and the page render.
const loadService = cache(async (rawId: string) => {
  const id = uuidParamSchema.safeParse(rawId);
  return id.success ? getService(id.data, { isAdmin: false }) : null;
});

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const service = await loadService((await params).id);
  if (!service) return { title: "Service not found" };
  return { title: service.name, description: service.description.slice(0, 160) };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const [service, session] = await Promise.all([loadService((await params).id), getSession()]);
  if (!service) notFound();
  const related = await getRelatedServices(service);

  const viewer = !session ? "guest" : session.role === "CUSTOMER" ? "customer" : "admin";
  const chip =
    "bg-card shadow-surface text-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm";

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/services" />}>Services</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/services?categoryId=${service.category.id}`} />}>
              {service.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-48 truncate sm:max-w-none">
              {service.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <article className="min-w-0 space-y-8">
          <ServiceImage
            name={service.name}
            imageUrl={service.imageUrl}
            categorySlug={service.category.slug}
            className="rounded-section"
            sizes="(min-width: 1200px) 740px, (min-width: 1024px) 60vw, 100vw"
            priority
          />
          <div className="space-y-4">
            <span className="bg-card shadow-surface text-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm">
              <CategoryIcon slug={service.category.slug} className="text-primary size-4" />
              {service.category.name}
            </span>
            <h1 className="text-h1 text-foreground font-medium text-balance max-sm:text-[32px]">
              {service.name}
            </h1>
            <ul className="flex flex-wrap gap-2" aria-label="Service details">
              <li className={chip}>
                <Clock className="text-primary size-4" aria-hidden="true" />
                {formatDuration(service.durationMinutes)}
              </li>
              <li className={chip}>
                <Wallet className="text-primary size-4" aria-hidden="true" />
                {formatPrice(service.price)}
              </li>
            </ul>
          </div>
          <section aria-labelledby="about-heading" className="space-y-3">
            <h2 id="about-heading" className="text-h3 text-foreground font-medium">
              About this service
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          </section>
          <section aria-labelledby="included-heading" className="space-y-4">
            <h2 id="included-heading" className="text-h3 text-foreground font-medium">
              What&apos;s included
            </h2>
            <ServiceIncluded categorySlug={service.category.slug} />
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel
            viewer={viewer}
            service={{
              id: service.id,
              name: service.name,
              price: service.price,
              durationMinutes: service.durationMinutes,
            }}
          />
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-8 pt-10">
          <SectionHeader
            id="related-heading"
            eyebrow={service.category.name}
            title="You might also like"
            action={
              <Link
                href={`/services?categoryId=${service.category.id}`}
                className={buttonVariants({ variant: "ghost" })}
              >
                See all
                <ButtonArrow />
              </Link>
            }
          />
          <ServiceGrid services={related} />
        </section>
      )}
    </div>
  );
}
