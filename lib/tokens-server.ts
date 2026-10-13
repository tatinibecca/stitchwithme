import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseThemeTokens } from "./tokens";

/** Lê os tokens direto de app/globals.css — a mesma fonte que o teste de contraste usa. */
export function loadThemeTokens() {
  return parseThemeTokens(readFileSync(join(process.cwd(), "app/globals.css"), "utf8"));
}
