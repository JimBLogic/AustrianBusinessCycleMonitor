import { SOURCE_POLICY_VERSION } from "@/lib/snapshot-policy.mjs";
import { readSourceValidationHistory } from "../../../db/runtime";
import { summarizeValidation } from "@/lib/source-validation.mjs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const history = await readSourceValidationHistory();
    return Response.json({ checkedAt:new Date().toISOString(), policy:SOURCE_POLICY_VERSION, candidates:summarizeValidation(history),
      note:"Checks run with actual macro refreshes. No automatic primary replacement. A working endpoint is not a redistribution licence. FRED components share FRED outage risk." },
      {headers:{"Cache-Control":"public, max-age=60","X-Content-Type-Options":"nosniff"}});
  } catch {
    return Response.json({status:"unavailable",candidates:[],note:"Durable validation history could not be read; no reliability claim."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
