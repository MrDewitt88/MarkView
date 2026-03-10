import { glob } from "glob";
import path from "node:path";

export async function resolveFiles(pattern: string): Promise<string[]> {
  const matches = await glob(pattern, {
    nodir: true,
    absolute: true,
  });

  const mdFiles = matches.filter((f) => f.endsWith(".md"));

  return mdFiles.map((f) => path.resolve(f));
}
