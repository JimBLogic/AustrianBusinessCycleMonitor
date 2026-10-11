import LearnHome from "./learn-home";

export const metadata = {
  title: "ABCM Learn · Austrian Economics, Bitcoin & Sovereignty",
  description: "A practical bilingual learning path from Austrian economics to Bitcoin and financial sovereignty.",
};

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <LearnHome initialLang={params.lang === "en" ? "en" : "es"} />;
}
