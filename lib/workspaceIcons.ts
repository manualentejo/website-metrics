// Ícones que cada workspace pode usar na barra lateral (para achar mais rápido). Só os ids vão para o banco.
export const WORKSPACE_ICON_IDS = [
  "folder", "briefcase", "building", "home", "store", "user", "team", "star", "heart", "rocket",
  "flag", "bookmark", "camera", "palette", "code", "globe", "bag", "leaf", "sun", "fire",
  "music", "game", "book", "cap", "bulb",
] as const;

export type WorkspaceIconId = (typeof WORKSPACE_ICON_IDS)[number];
export const DEFAULT_WORKSPACE_ICON: WorkspaceIconId = "folder";

export const isWorkspaceIcon = (v: unknown): v is WorkspaceIconId => typeof v === "string" && (WORKSPACE_ICON_IDS as readonly string[]).includes(v);
