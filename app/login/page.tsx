import { redirect } from "next/navigation";
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
    redirect(user.role === "admin" ? "/settings" : user.role === "private" ? "/private" : "/shared");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black px-6 py-12">
      <LoginForm next={next} />
    </main>
  );
}
