export type ProjectVisibility = "private" | "shared" | "open";

export type ProjectStatus = "draft" | "active" | "archived";

export type StoredProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  visibility: ProjectVisibility;
  previewImage: string;
  tags: string[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStore = {
  storeVersion: number;
  projects: StoredProject[];
};

export type ProjectRecord = StoredProject & {
  path: string;
};
