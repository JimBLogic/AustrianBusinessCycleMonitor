import { pageMetadata } from "@/lib/seo";
import LearnHome from "./learn-home";

export const metadata = pageMetadata("/learn", "Aprende economía austriaca y Bitcoin", "Dos rutas, 12 módulos y 48 preguntas bilingües con orden aleatorio, explicaciones y fuentes.");

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <LearnHome initialLang={params.lang === "en" ? "en" : "es"} />;
}
