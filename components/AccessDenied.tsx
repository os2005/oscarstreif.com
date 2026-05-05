import { ProtectedContent } from "./ProtectedContent";

export function AccessDenied() {
  return (
    <ProtectedContent
      title="Access restricted"
      description="You do not have access to this area."
      label="Access denied"
    />
  );
}
