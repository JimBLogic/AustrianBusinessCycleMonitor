import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import WorkspaceClient from "./workspace-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Área soberana · ABCM",
  description: "Espacio privado para tareas, cartera, revisiones, archivos y copias portables.",
};

export default async function WorkspacePage() {
  const user = await requireChatGPTUser("/workspace");
  return <WorkspaceClient user={{ displayName: user.displayName, email: user.email }} signOutPath={chatGPTSignOutPath("/")} />;
}
