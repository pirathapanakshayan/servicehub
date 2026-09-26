export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // AuthCard renders the split layout (brand panel + <main>), so no navbar here.
  return children;
}
