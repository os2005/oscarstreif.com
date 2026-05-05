import { AccessPlaceholder } from "@/components/AccessPlaceholder";

export const metadata = {
  title: "Private",
};

export default function PrivatePage() {
  return (
    <AccessPlaceholder
      title="Private workspace"
      description="Oscar's private workspace will later hold planning, dashboards, notes, project management and internal tools."
      label="Access reserved"
    />
  );
}
