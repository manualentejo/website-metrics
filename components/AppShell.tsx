import type { ReactNode } from "react";

// A moldura agora vive em app/(app)/layout.tsx (AppFrame). Este componente só mantém as páginas
// antigas funcionando: as props de "ativo" vêm da URL na barra lateral.
export default function AppShell({ children, aside }: { children: ReactNode; active?: string; activeSiteId?: string; activeFolderId?: string; aside?: ReactNode }) {
  return (
    <>
      {children}
      {aside}
    </>
  );
}
