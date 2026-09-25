import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { requirePageUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requirePageUser("/profile");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description={`Member since ${formatDate(user.createdAt.toISOString().slice(0, 10))}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="profile-heading"
          className="bg-card border-border rounded-card border p-6"
        >
          <h2 id="profile-heading" className="text-ink text-lg font-semibold">
            Personal details
          </h2>
          <p className="text-muted-foreground mb-5 text-sm">Update your name and phone number.</p>
          <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} />
        </section>

        <section
          aria-labelledby="password-heading"
          className="bg-card border-border rounded-card border p-6"
        >
          <h2 id="password-heading" className="text-ink text-lg font-semibold">
            Change password
          </h2>
          <p className="text-muted-foreground mb-5 text-sm">
            Enter your current password to set a new one.
          </p>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
