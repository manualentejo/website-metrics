"use client";

import type { ComponentType } from "react";
import {
  RiBookmarkLine, RiBookOpenLine, RiBriefcaseLine, RiBuildingLine, RiCameraLine, RiCodeLine, RiFireLine, RiFlagLine,
  RiFolderLine, RiGamepadLine, RiGlobalLine, RiGraduationCapLine, RiHeartLine, RiHomeLine, RiLeafLine, RiLightbulbLine,
  RiMusicLine, RiPaletteLine, RiRocketLine, RiShoppingBagLine, RiStarLine, RiStoreLine, RiSunLine, RiTeamLine, RiUserLine,
} from "@remixicon/react";
import { DEFAULT_WORKSPACE_ICON, type WorkspaceIconId } from "@/lib/workspaceIcons";

export const ICONS: Record<WorkspaceIconId, { Icon: ComponentType<{ className?: string }>; label: string }> = {
  folder: { Icon: RiFolderLine, label: "Pasta" },
  briefcase: { Icon: RiBriefcaseLine, label: "Maleta" },
  building: { Icon: RiBuildingLine, label: "Prédio" },
  home: { Icon: RiHomeLine, label: "Casa" },
  store: { Icon: RiStoreLine, label: "Loja" },
  user: { Icon: RiUserLine, label: "Pessoa" },
  team: { Icon: RiTeamLine, label: "Equipe" },
  star: { Icon: RiStarLine, label: "Estrela" },
  heart: { Icon: RiHeartLine, label: "Coração" },
  rocket: { Icon: RiRocketLine, label: "Foguete" },
  flag: { Icon: RiFlagLine, label: "Bandeira" },
  bookmark: { Icon: RiBookmarkLine, label: "Marcador" },
  camera: { Icon: RiCameraLine, label: "Câmera" },
  palette: { Icon: RiPaletteLine, label: "Paleta" },
  code: { Icon: RiCodeLine, label: "Código" },
  globe: { Icon: RiGlobalLine, label: "Globo" },
  bag: { Icon: RiShoppingBagLine, label: "Sacola" },
  leaf: { Icon: RiLeafLine, label: "Folha" },
  sun: { Icon: RiSunLine, label: "Sol" },
  fire: { Icon: RiFireLine, label: "Chama" },
  music: { Icon: RiMusicLine, label: "Música" },
  game: { Icon: RiGamepadLine, label: "Jogo" },
  book: { Icon: RiBookOpenLine, label: "Livro" },
  cap: { Icon: RiGraduationCapLine, label: "Formatura" },
  bulb: { Icon: RiLightbulbLine, label: "Ideia" },
};

/** Ícone de um workspace (a pasta, se nenhum foi escolhido). */
export default function WorkspaceIcon({ icon, className = "size-5" }: { icon?: string | null; className?: string }) {
  const entry = ICONS[(icon as WorkspaceIconId) ?? DEFAULT_WORKSPACE_ICON] ?? ICONS[DEFAULT_WORKSPACE_ICON];
  const Icon = entry.Icon;
  return <Icon className={className} />;
}
