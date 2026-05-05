import { ProtectedContent } from "@/components/ProtectedContent";
import { getAccessForRole } from "@/lib/auth";

export const metadata = {
  title: "Shared",
};

export default async function SharedPage() {
  const access = await getAccessForRole("shared");

  if (!access) {
    return null;
  }

  return (
    <ProtectedContent
      title="Shared Area"
      description="This area is only visible to invited users."
      label="Protected"
    />
  );
}
