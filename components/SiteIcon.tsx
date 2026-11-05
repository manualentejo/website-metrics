"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const hostOf = (url: string) => url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "").toLowerCase();

const IconsContext = createContext<Record<string, string>>({});

/** Entrega a todos os SiteIcon o mapa domínio → ícone descoberto no servidor. */
export function SiteIconsProvider({ icons, children }: { icons: Record<string, string>; children: ReactNode }) {
  return <IconsContext.Provider value={icons}>{children}</IconsContext.Provider>;
}

/**
 * Ícone do site. Usa o ícone configurado no próprio site (descoberto ao cadastrar); se não houver
 * (ou não carregar), mostra a inicial do nome.
 */
export default function SiteIcon({ url, name, size = 20, className = "" }: { url: string; name: string; size?: number; className?: string }) {
  const icons = useContext(IconsContext);
  const host = hostOf(url);
  const sources = icons[host] ? [icons[host]] : [];
  const [failed, setFailed] = useState(0);
  const style = { width: size, height: size };

  if (failed >= sources.length)
    return (
      <span
        style={{ ...style, fontSize: Math.max(10, size * 0.5) }}
        className={`flex flex-shrink-0 items-center justify-center rounded-md bg-bg-weak-50 uppercase text-text-sub-600 ${className}`}
        aria-hidden
      >
        {name.slice(0, 1)}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={sources[failed]}
      src={sources[failed]}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      style={style}
      onError={() => setFailed((n) => n + 1)}
      className={`flex-shrink-0 rounded-md bg-bg-white-0 object-contain ${className}`}
    />
  );
}
