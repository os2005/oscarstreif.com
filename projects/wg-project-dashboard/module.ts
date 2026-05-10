import { WgProjectDashboardSharedPage } from "./SharedPage";
import type { ProjectModuleDefinition } from "@/lib/project-modules/types";

export const wgProjectDashboardModule: ProjectModuleDefinition = {
  slug: "wg-project-dashboard",
  title: "WG Project Dashboard",
  defaultDescription: "A private dashboard for planning, funding, and tracking WG projects.",
  documentationPath: "docs/project-platform.md",
  dataNamespace: "wg-project-dashboard",
  requiredFeatures: ["shared-route", "private-access", "shared-access"],
  moduleStatus: "ready",
  SharedPage: WgProjectDashboardSharedPage,
};
