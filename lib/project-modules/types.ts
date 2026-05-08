import type { JSX } from "react";
import type { SessionUser } from "@/lib/auth-types";
import type { ProjectRecord } from "@/lib/project-types";

export type ProjectModuleSharedPageProps = {
  backHref: string;
  backLabel: string;
  isDark: boolean;
  pathLabel: string;
  project: ProjectRecord;
  viewer: SessionUser | null;
};

export type ProjectModuleAdminPanelProps = {
  project: ProjectRecord;
};

export type ProjectModuleDefinition = {
  slug: string;
  title: string;
  defaultDescription?: string;
  documentationPath?: string;
  dataNamespace?: string;
  requiredFeatures?: string[];
  moduleStatus?: "draft" | "ready";
  SharedPage: (props: ProjectModuleSharedPageProps) => JSX.Element;
  // Future extension point only. AdminPanel is not yet rendered inside the Private Workspace.
  AdminPanel?: (props: ProjectModuleAdminPanelProps) => JSX.Element;
};
