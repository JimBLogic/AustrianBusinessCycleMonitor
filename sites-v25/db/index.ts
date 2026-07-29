import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getBindings } from "./runtime";

export function getDb() {
  const { db } = getBindings();
  return drizzle(db as Parameters<typeof drizzle>[0], { schema });
}
