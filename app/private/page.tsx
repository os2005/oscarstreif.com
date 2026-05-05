import { AccessDenied } from "@/components/AccessDenied";
import { ProtectedContent } from "@/components/ProtectedContent";
import { getAccessForRole } from "@/lib/auth";

export const metadata = {
  title: "Private",
};

export default async function PrivatePage() {
  const access = await getAccessForRole("admin");

  if (!access) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return (
    <ProtectedContent
      title="Private Area"
      description="This area is only visible to the admin."
      label="Admin only"
    />
  );
}
