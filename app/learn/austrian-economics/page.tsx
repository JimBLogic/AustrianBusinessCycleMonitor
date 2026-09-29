import { pageMetadata } from "@/lib/seo";
import AcademyCourse from "../course";

export const metadata = pageMetadata("/learn/austrian-economics", "Economía austriaca", "Seis módulos y 24 preguntas sobre acción, dinero, interés, capital, ciclo y evidencia.");

export default async function AustrianCourse({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <AcademyCourse track="austrian" initialLang={params.lang === "en" ? "en" : "es"} />;
}
