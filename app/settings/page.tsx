import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { getAccessForRole } from "@/lib/auth";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const access = await getAccessForRole("admin");

  if (!access) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  redirect("/private");
}
