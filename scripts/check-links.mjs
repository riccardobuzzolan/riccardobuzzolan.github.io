import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync("index.html", "utf8");
const failures = [];
const attributes = html.matchAll(/(?:href|src)=["']([^"']+)["']/g);

for (const [, raw] of attributes) {
  if (/^(?:https?:|mailto:|data:|javascript:)/.test(raw)) continue;
  if (raw.startsWith("#")) {
    const id = raw.slice(1);
    if (id && !new RegExp(`id=["']${id}["']`).test(html)) {
      failures.push(`Ancora mancante: ${raw}`);
    }
    continue;
  }
  const path = raw.split(/[?#]/)[0].replace(/^\//, "");
  if (path && !existsSync(resolve(path)))
    failures.push(`File mancante: ${raw}`);
}

for (const match of html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
)) {
  try {
    JSON.parse(match[1]);
  } catch {
    failures.push("Dati strutturati JSON-LD non validi");
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Collegamenti locali, ancore e JSON-LD validi.");
