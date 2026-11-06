"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Segmented } from "@/components/ui/Page";

type Device = "desktop" | "mobile";

export function saveDevice(d: Device) {
  try {
    document.cookie = `device=${d}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* sem cookie: só vale nesta tela */
  }
}

/** Seletor global Computador/Celular. Grava um cookie e recarrega os dados da página atual. */
export default function DeviceToggle({ value }: { value: Device }) {
  const router = useRouter();
  const [device, setDevice] = useState<Device>(value);
  const [, start] = useTransition();
  return (
    <Segmented
      label="Dispositivo"
      items={[
        { label: "Computador", href: "#", active: device === "desktop" },
        { label: "Celular", href: "#", active: device === "mobile" },
      ]}
      onSelect={(i) => {
        const d: Device = i === 0 ? "desktop" : "mobile";
        setDevice(d);
        saveDevice(d);
        start(() => router.refresh());
      }}
    />
  );
}
