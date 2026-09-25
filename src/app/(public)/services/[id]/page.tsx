import { CalendarPlus, Clock, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { BookingForm } from "@/components/bookings/booking-form";
import { CategoryIcon } from "@/components/services/category-icon";
import { ServiceImage } from "@/components/services/service-image";
import { getSession } from "@/lib/auth";
import { formatDuration, formatPrice } from "@/lib/format";
import { getService } from "@/lib/services";
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

  const isCustomer = session?.role === "CUSTOMER";
  const bookHref = session
    ? "#book"
    : `/login?redirect=${encodeURIComponent(`/services/${service.id}#book`)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
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

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article className="space-y-6">
          <ServiceImage
            name={service.name}
            imageUrl={service.imageUrl}
            categorySlug={service.category.slug}
            className="rounded-card border-border border"
            sizes="(min-width: 1024px) 700px, 100vw"
            priority
          />
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1.5">
              <CategoryIcon slug={service.category.slug} className="size-3.5" />
              {service.category.name}
            </Badge>
            <h1 className="text-ink text-3xl font-bold tracking-tight">{service.name}</h1>
          </div>
          <section aria-labelledby="about-heading" className="space-y-2">
            <h2 id="about-heading" className="text-ink text-lg font-semibold">
              About this service
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card border-border rounded-card space-y-5 border p-6 shadow-sm">
            <div>
              <p className="text-muted-foreground text-sm">Price</p>
              <p className="text-ink text-3xl font-bold">{formatPrice(service.price)}</p>
            </div>
            <dl className="divide-border divide-y text-sm">
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4" aria-hidden="true" />
                  Duration
                </dt>
                <dd className="text-ink font-medium">{formatDuration(service.durationMinutes)}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <Tag className="size-4" aria-hidden="true" />
                  Category
                </dt>
                <dd className="text-ink font-medium">{service.category.name}</dd>
              </div>
            </dl>
            {session && !isCustomer ? (
              <p className="text-muted-foreground bg-background border-border rounded-control border p-3 text-center text-sm">
                Admin accounts can&apos;t make bookings.
              </p>
            ) : (
              <Link href={bookHref} className={buttonVariants({ className: "h-11 w-full" })}>
                <CalendarPlus aria-hidden="true" />
                Book this service
              </Link>
            )}
            {!session && (
              <p className="text-muted-foreground text-center text-xs">
                You&apos;ll be asked to log in before booking.
              </p>
            )}
          </div>
        </aside>
      </div>

      {isCustomer && (
        <section
          id="book"
          aria-labelledby="book-heading"
          className="bg-card border-border rounded-card scroll-mt-24 border p-6 shadow-sm"
        >
          <h2 id="book-heading" className="text-ink mb-6 text-xl font-bold">
            Book this service
          </h2>
          <BookingForm
            service={{
              id: service.id,
              name: service.name,
              price: service.price,
              durationMinutes: service.durationMinutes,
            }}
          />
        </section>
      )}
    </div>
  );
}
