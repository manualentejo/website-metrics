import Badge from "@/components/ui/Badge";
import type { Status } from "@/lib/types";

/** Status de monitoramento do site (o mesmo vocabulário do restante do painel). */
export default function StatusBadge({ status }: { status: Status }) {
  return status === "no_ar" ? (
    <Badge tone="success" dot>No ar</Badge>
  ) : (
    <Badge tone="warning" dot>Em andamento</Badge>
  );
}
