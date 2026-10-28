import { redirect } from "next/navigation";

// As configurações agora ficam dentro do perfil.
export default function SettingsRedirect() {
  redirect("/perfil?aba=analises");
}
