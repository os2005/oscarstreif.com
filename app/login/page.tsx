import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/LoginForm";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const next = params.next;

  if (user) {
    redirect(user.role === "admin" ? "/settings" : "/shared");
  }

  return (
    <PageShell eyebrow="Secure access" title="Login" quiet>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <AuthCard
          title="Protected spaces"
          description="Private, shared and settings areas are only available after a successful login. Invited users will only see the shared workspace."
        >
          <ul className="space-y-4 text-lg leading-8 text-ink/72">
            <li>Admin users can access Private, Shared and Settings.</li>
            <li>Shared users can access the Shared Area only.</li>
            <li>Unauthenticated visitors are redirected here automatically.</li>
          </ul>
        </AuthCard>
        <AuthCard title="Sign in" description="Use your account credentials to open the protected areas.">
          <LoginForm next={next} />
        </AuthCard>
      </div>
    </PageShell>
  );
}
