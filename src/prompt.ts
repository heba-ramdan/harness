import { readFile } from "node:fs/promises";

export async function loadIdentity(identityPath: string): Promise<string> {
  return readFile(identityPath, "utf-8");
}
