import { notFound } from "next/navigation";
import { getViewer } from "@/lib/access";
import Demo from "./Demo";

export const dynamic = "force-dynamic";

// Página temporária para avaliar o rakibulism-ui; só o dono vê.
export default async function UiTestePage() {
  const viewer = await getViewer();
  if (!viewer?.owner) notFound();
  return <Demo />;
}
