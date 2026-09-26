import type { Metadata } from "next";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { requirePageUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

const card = "bg-card shadow-surface rounded-card space-y-6 p-6 sm:p-8";

export default async function ProfilePage() {
  const user = await requirePageUser("/profile");

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-5">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold sm:size-20 sm:text-2xl"
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0 space-y-1">
          <h1 className="text-h2 sm:text-h1 text-foreground truncate font-medium">{user.name}</h1>
          <p className="text-muted-foreground text-sm">
            {user.email} · Member since {formatDate(user.createdAt.toISOString().slice(0, 10))}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="profile-heading" className={card}>
          <div className="space-y-1">
            <h2 id="profile-heading" className="text-h3 text-foreground font-medium">
              Personal details
            </h2>
            <p className="text-muted-foreground text-sm">Update your name and phone number.</p>
          </div>
          <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} />
        </section>

        <section aria-labelledby="password-heading" className={card}>
          <div className="space-y-1">
            <h2 id="password-heading" className="text-h3 text-foreground font-medium">
              Change password
            </h2>
            <p className="text-muted-foreground text-sm">
              Enter your current password to set a new one.
            </p>
          </div>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
