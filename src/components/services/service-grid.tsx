import { ServiceCard } from "@/components/services/service-card";
import type { ServiceDTO } from "@/lib/services";

export function ServiceGrid({ services }: { services: ServiceDTO[] }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <li key={service.id} className="min-w-0">
          <ServiceCard service={service} />
        </li>
      ))}
    </ul>
  );
}
