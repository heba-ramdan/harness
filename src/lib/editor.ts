import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function openEditorSync(text: string): string | null {
  const editor = process.env.EDITOR || "vi";
  const dir = mkdtempSync(join(tmpdir(), "mastersof-ai-"));
  const tmpFile = join(dir, "input.txt");

  try {
    writeFileSync(tmpFile, text);
    const result = spawnSync(editor, [tmpFile], {
      stdio: "inherit",
      shell: true,
    });
    if (result.status !== 0) return null;
    return readFileSync(tmpFile, "utf-8");
  } finally {
    try {
      rmSync(dir, { recursive: true });
    } catch {}
  }
}
