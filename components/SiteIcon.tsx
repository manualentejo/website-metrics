"use client";

import { useState } from "react";

const hostOf = (url: string) => url.replace(/^https?:\/\//, "").split("/")[0];

/**
 * Ícone do site (o favicon configurado nele). Se não carregar, mostra a inicial.
 * O navegador pede a imagem ao serviço de favicons do Google usando só o domínio do site.
 */
export default function SiteIcon({ url, name, size = 20, className = "" }: { url: string; name: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (failed)
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
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(url))}&sz=64`}
      alt=""
      loading="lazy"
      decoding="async"
      style={style}
      onError={() => setFailed(true)}
      className={`flex-shrink-0 rounded-md bg-bg-white-0 object-contain ${className}`}
    />
  );
}
