import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-10">
      <Card className="rounded-card w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="text-primary mx-auto mb-2 text-lg font-bold">
            ServiceHub
          </Link>
          <CardTitle>
            <h1 className="text-ink text-2xl font-semibold">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {footer && <div className="text-muted-foreground text-center text-sm">{footer}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
