import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { sites, folders } from "@/db/schema";
import { asc } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import SettingsForm from "@/components/SettingsForm";
import { getViewer } from "@/lib/access";
import { getSettings } from "@/lib/settings";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!viewer.owner) redirect("/");

  const [allSites, allFolders, settings] = await Promise.all([
    db.select().from(sites).orderBy(asc(sites.sortOrder)),
    db.select().from(folders).orderBy(asc(folders.sortOrder)),
    getSettings(),
  ]);

  return (
    <div className="flex">
      <Sidebar
        sites={allSites.map((s) => ({ id: s.id, name: s.name, status: s.status as Status, folderId: s.folderId }))}
        folders={allFolders}
        userEmail={viewer.email}
        isOwner
        settingsActive
      />
      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quando e como as análises dos sites são executadas.</p>
          </header>
          <SettingsForm initial={settings} />
        </div>
      </main>
    </div>
  );
}
