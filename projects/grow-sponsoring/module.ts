import { GrowSponsoringSharedPage } from "./SharedPage";
import type { ProjectModuleDefinition } from "@/lib/project-modules/types";

export const growSponsoringProjectModule: ProjectModuleDefinition = {
  slug: "grow-sponsoring",
  title: "Grow Sponsoring",
  defaultDescription: "Shared sponsor pipeline and relationship surface.",
  documentationPath: "docs/project-platform.md",
  dataNamespace: "grow-sponsoring",
  requiredFeatures: ["shared-route", "shared-access"],
  moduleStatus: "ready",
  SharedPage: GrowSponsoringSharedPage,
};
