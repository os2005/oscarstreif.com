import { AccessPlaceholder } from "@/components/AccessPlaceholder";

export const metadata = {
  title: "Shared",
};

export default function SharedPage() {
  return (
    <AccessPlaceholder
      title="Shared projects"
      description="This area is prepared for selected shared project spaces, restricted resources and collaborator access."
      label="Restricted"
    />
  );
}
