import { cacheLife } from "next/cache";
import { osloToday } from "./view";

/**
 * Dagens dato i Europe/Oslo. Cachet i en time, så sidene kan prerendres
 * og likevel slutter å vise tilbud kort tid etter at de har gått ut.
 */
export async function getToday(): Promise<string> {
  "use cache";
  cacheLife("hours");
  return osloToday();
}
