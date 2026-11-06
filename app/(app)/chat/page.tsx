import { redirect } from "next/navigation";
import NumaChat from "@/components/chat/NumaChat";
import { getViewer } from "@/lib/access";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

// Frases de abertura (sem gênero e sem clichê). O horário e o dia (Brasília) escolhem qual aparece.
function greetingFor(name: string, now = new Date()) {
  const br = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const hour = br.getUTCHours();
  const day = Math.floor(br.getTime() / 86400000);
  const period = hour < 5 ? "Boa madrugada" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const options = [
    `${period}, ${name}. O que vamos olhar hoje?`,
    `${name}, qual site merece atenção agora?`,
    `Vamos aos números, ${name}?`,
    `${period}, ${name}. Por onde começamos?`,
    `Os sites estão esperando, ${name}.`,
    `${name}, o que você quer descobrir hoje?`,
  ];
  return options[day % options.length];
}

export default async function ChatPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const profile = await getProfile(viewer.email).catch(() => ({}) as { name?: string | null });
  const full = (profile.name ?? viewer.name ?? viewer.email.split("@")[0]).trim();
  const first = full.split(/\s+/)[0] || "você";
  return <NumaChat email={viewer.email} greeting={greetingFor(first)} />;
}
