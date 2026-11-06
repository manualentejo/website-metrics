import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProfileForm from "@/components/ProfileForm";
import SettingsForm from "@/components/SettingsForm";
import { Page, Segmented } from "@/components/ui/Page";
import Avatar from "@/components/ui/Avatar";
import { getViewer } from "@/lib/access";
import { getProfile } from "@/lib/profile";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const profile = await getProfile(viewer.email);
  const name = profile.name ?? viewer.name ?? viewer.email.split("@")[0];
  const image = profile.image ?? viewer.image ?? null;
  const tab = viewer.owner && aba === "analises" ? aba : "dados";
  const settings = tab === "analises" ? await getSettings() : null;

  const tabs = [
    { label: "Meus dados", href: "/perfil", active: tab === "dados" },
    ...(viewer.owner
      ? [
          { label: "Relatório", href: "/perfil?aba=analises", active: tab === "analises" },
        ]
      : []),
  ];

  return (
    <AppShell active="perfil">
      <Page
        width="max-w-4xl"
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} image={image} size={44} />
            <span>
              {name}
              <span className="block text-paragraph-sm font-normal text-text-sub-600">{profile.role ?? viewer.email}</span>
            </span>
          </span>
        }
        actions={<Segmented label="Seções do perfil" items={tabs} />}
      >
        {tab === "dados" && (
          <ProfileForm email={viewer.email} initial={{ name, role: profile.role ?? "", image }} />
        )}
        {tab === "analises" && settings && (
          <>
            <p className="text-paragraph-sm text-text-sub-600">Quando o relatório semanal é gerado.</p>
            <SettingsForm initial={settings} />
          </>
        )}
      </Page>
    </AppShell>
  );
}
