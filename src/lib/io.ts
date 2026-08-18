import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Returns command-line text or a fallback example when no text was supplied. */
export function getCliInput(fallback: string): string {
  const input = process.argv.slice(2).join(" ").trim();
  return input || fallback;
}

/** Lets a pattern run directly while still allowing run-all.ts to import it. */
export function isDirectRun(moduleUrl: string): boolean {
  const entryFile = process.argv[1];
  return entryFile ? moduleUrl === pathToFileURL(resolve(entryFile)).href : false;
}

/** Prints a clearly labeled section to the terminal. */
export function printSection(title: string, body: string): void {
  console.log(`\n=== ${title} ===\n${body}`);
}

/** Writes genuine program output to logs after a successful run. */
export async function saveExecutionLog(
  patternSlug: string,
  sections: Array<{ title: string; body: string }>,
): Promise<string> {
  await mkdir("logs", { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = `logs/${patternSlug}-${timestamp}.txt`;
  const content = sections
    .map(({ title, body }) => `=== ${title} ===\n${body}`)
    .join("\n\n");

  await writeFile(filePath, `${content}\n`, "utf8");
  return filePath;
}

/** Gives a readable error and makes the terminal command fail correctly. */
export function handleRunError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nRun failed: ${message}`);
  process.exitCode = 1;
}
