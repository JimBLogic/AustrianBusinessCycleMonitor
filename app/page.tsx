import Monitor, {type Data} from "./monitor";
import { readPersistedEdition } from "./api/data/route";
export const dynamic = "force-dynamic";
export default async function Home() {
  // Render durable observations in the first HTML, without waiting for providers.
  const response = await readPersistedEdition(new Request("https://abcm.local/api/data"));
  const initialData = response ? await response.json() as Data : null;
  return <Monitor initialData={initialData} />;
}
