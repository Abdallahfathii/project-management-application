export type ProjectStatus = "In Progress" | "Completed" | "On Hold" | "Planning";

export interface ProjectTask {
  id: string;
  name: string;
  done: boolean;
  createdAt: string;
}

export interface ProjectNote {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  tasks: ProjectTask[];
  notes: ProjectNote[];
}

export interface AppData {
  projects: Project[];
  lastModified: string;
}

export type Theme = "dark" | "light";
export type PageKey = "dashboard" | "add" | "settings" | "detail" | "edit" | "account" | "notifications" | "notes";

export interface UserAppearance {
  accentIndex: number;
  sidebarGradient: boolean;
  compactLayout: boolean;
  roundedStyle: "rounded" | "sharp" | "pill";
}
export interface UserNotifications {
  taskReminders: boolean;
  projectUpdates: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
  desktopPush: boolean;
  emailDigest: boolean;
}
export interface UserNote {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
export interface UserPrefs {
  photo: string;
  bio: string;
  role: string;
  theme: Theme;
  sidebarCollapsed: boolean;
  language: "en" | "ar";
  appearance: UserAppearance;
  notifications: UserNotifications;
  notes: UserNote[];
}
