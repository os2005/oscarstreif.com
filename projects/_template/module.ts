import { TemplateProjectSharedPage } from "./SharedPage";
import type { ProjectModuleDefinition } from "@/lib/project-modules/types";

export const templateProjectModule: ProjectModuleDefinition = {
  slug: "your-project-slug",
  title: "Your Project Name",
  defaultDescription: "Short default description for the internal shared project page.",
  documentationPath: "projects/_template/README.md",
  dataNamespace: "your-project-slug",
  requiredFeatures: ["shared-route"],
  moduleStatus: "draft",
  SharedPage: TemplateProjectSharedPage,
};
