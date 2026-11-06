import { cookies } from "next/headers";

export type Device = "desktop" | "mobile";

/** Dispositivo escolhido no seletor global (cookie). Vale para Visão geral, Sites e Alertas. */
export async function getDevice(): Promise<Device> {
  const v = (await cookies()).get("device")?.value;
  return v === "mobile" ? "mobile" : "desktop";
}
