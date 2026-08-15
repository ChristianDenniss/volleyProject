import { revalidatePath } from "next/cache";

export function revalidate(...paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}
