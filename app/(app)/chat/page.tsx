import { redirect } from "next/navigation";
import NumaChat from "@/components/chat/NumaChat";
import { getViewer } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return <NumaChat email={viewer.email} />;
}
