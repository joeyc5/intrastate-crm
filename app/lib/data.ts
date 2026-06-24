import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The CA counties for the origin/destination dropdowns, read from the same
 * Item 210 territory table the engine uses (so every option is a county the
 * engine can map to a territory). Display names are the proper-case values
 * from the CSV; the engine matches case-insensitively on submit.
 */
export function getCounties(): string[] {
  const text = readFileSync(join(process.cwd(), "data", "2026", "territories.csv"), "utf8");
  const counties = text
    .trim()
    .split(/\r?\n/)
    .slice(1) // drop header
    .map((line) => line.split(",")[0]?.trim())
    .filter((county): county is string => Boolean(county));
  return [...new Set(counties)].sort((a, b) => a.localeCompare(b));
}
