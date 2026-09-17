import { revalidatePath } from "next/cache";
import { invalidateSiteReads } from "@server/services/site-read-cache";

export async function revalidate(...paths: string[]): Promise<void> {
  await invalidateSiteReads();
  for (const path of paths) {
    revalidatePath(path);
  }
}
