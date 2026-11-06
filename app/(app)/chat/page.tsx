import { redirect } from "next/navigation";
import NumaChat from "@/components/chat/NumaChat";
import { getViewer } from "@/lib/access";
import { listChats } from "@/lib/numaChat";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const chats = await listChats(viewer.email).catch(() => []);
  return <NumaChat initialChats={chats} />;
}
