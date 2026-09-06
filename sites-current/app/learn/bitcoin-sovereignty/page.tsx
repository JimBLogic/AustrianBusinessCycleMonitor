import { pageMetadata } from "@/lib/seo";
import AcademyCourse from "../course";

export const metadata = pageMetadata("/learn/bitcoin-sovereignty", "Bitcoin y soberanía financiera", "Seis módulos y 24 preguntas sobre protocolo, UTXO, nodos, autocustodia y privacidad.");

export default async function BitcoinCourse({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <AcademyCourse track="bitcoin" initialLang={params.lang === "en" ? "en" : "es"} />;
}
