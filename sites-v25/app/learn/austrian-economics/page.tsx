import AcademyCourse from "../course";

export const metadata = {
  title: "Austrian Economics · ABCM Learn",
  description: "A practical six-module introduction to Austrian economics and the business cycle.",
};

export default async function AustrianCourse({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <AcademyCourse track="austrian" initialLang={params.lang === "en" ? "en" : "es"} />;
}
