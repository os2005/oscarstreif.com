export type ProjectVisibility = "private" | "shared" | "open";

export type ProjectStatus = "draft" | "active" | "archived";

export type ProjectMockSection = {
  title: string;
  body: string;
};

export type ProjectMockData = {
  eyebrow: string;
  headline: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  highlights: string[];
  sections: ProjectMockSection[];
};

export type StoredProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  visibility: ProjectVisibility;
  previewImage: string;
  accentColor?: string;
  secondaryColor?: string;
  externalRedirectUrl?: string;
  tags: string[];
  status: ProjectStatus;
  mock?: ProjectMockData;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStore = {
  storeVersion: number;
  projects: StoredProject[];
};

export type ProjectRecord = StoredProject & {
  path: string;
  sharedPath: string;
  visitPath: string;
};
