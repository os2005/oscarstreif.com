import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";
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
    redirect(user.role === "admin" ? "/private" : "/shared");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <Header variant="landing" />
      <section className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">Login</p>
          <LoginForm next={next} />
        </div>
      </section>
    </main>
  );
}
