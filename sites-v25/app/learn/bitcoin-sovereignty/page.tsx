import AcademyCourse from "../course";

export const metadata = {
  title: "Bitcoin & Financial Sovereignty · ABCM Learn",
  description: "A practical six-module path through Bitcoin, self-custody, privacy and financial sovereignty.",
};

export default async function BitcoinCourse({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <AcademyCourse track="bitcoin" initialLang={params.lang === "en" ? "en" : "es"} />;
}
