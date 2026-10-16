import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const root = resolve(".");
const origin = "https://riccardobuzzolan.github.io";
const failures = [];
const required = [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "apple-touch-icon.png",
  "social-preview.png",
  "assets/css/style.css",
  "assets/js/main.js",
  "assets/images/portrait.webp",
];
for (const file of required)
  if (!existsSync(resolve(file)))
    failures.push("File richiesto mancante: " + file);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      [".git", "node_modules", "coverage", "test-results"].includes(entry.name)
    )
      return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const files = walk(root);
const htmlFiles = files.filter((path) => extname(path) === ".html");
const ids = new Map();
for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  const all = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  ids.set(path, new Set(all));
  if (all.length !== new Set(all).size)
    failures.push("ID duplicati: " + relative(root, path));
  if ((html.match(/<h1\b/gi) || []).length !== 1)
    failures.push("H1 mancante o duplicato: " + relative(root, path));
}

function checkReference(raw, owner, base = dirname(owner)) {
  const value = raw.replaceAll("&amp;", "&");
  if (/^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(value)) return;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    failures.push("Protocollo non consentito: " + relative(root, owner));
    return;
  }
  let path, fragment;
  try {
    const url = new URL(value, "https://local.invalid/");
    const pathname = decodeURIComponent(value.split(/[?#]/)[0]);
    path = pathname
      ? resolve(
          value.startsWith("/") ? root : base,
          pathname.replace(/^\//, ""),
        )
      : owner;
    fragment = decodeURIComponent(url.hash.slice(1));
  } catch {
    failures.push("Riferimento non valido: " + relative(root, owner));
    return;
  }
  if (path !== root && !path.startsWith(root + sep)) {
    failures.push("Riferimento fuori dal sito: " + relative(root, owner));
    return;
  }
  if (existsSync(path) && statSync(path).isDirectory())
    path = join(path, "index.html");
  if (!existsSync(path))
    failures.push("File mancante: " + relative(root, owner) + " → " + value);
  else if (
    fragment &&
    extname(path) === ".html" &&
    !ids.get(path)?.has(fragment)
  )
    failures.push("Ancora mancante: " + relative(root, owner) + " → " + value);
}

for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  for (const [, value] of html.matchAll(
    /\b(?:href|src|poster)=["']([^"']+)["']/g,
  ))
    checkReference(value, path);
  for (const [, value] of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(value);
      if (
        !data["@context"] ||
        (!data["@type"] && !Array.isArray(data["@graph"]))
      )
        failures.push("JSON-LD incompleto: " + relative(root, path));
    } catch {
      failures.push("JSON-LD non valido: " + relative(root, path));
    }
  }
}
for (const path of files.filter((file) => extname(file) === ".css")) {
  for (const [, value] of readFileSync(path, "utf8").matchAll(
    /url\(\s*["']?([^\s"')]+)["']?\s*\)/g,
  ))
    checkReference(value, path);
}
for (const path of files.filter((file) => /\.[cm]?js$/.test(file))) {
  execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
  if (path.includes(sep + "assets" + sep)) {
    for (const [, value] of readFileSync(path, "utf8").matchAll(
      /["'](\.\/assets\/[^"'\n]+)["']/g,
    ))
      checkReference(value, path, root);
  }
}
const home = readFileSync(resolve("index.html"), "utf8");
if (!home.includes('rel="canonical" href="' + origin + '/"'))
  failures.push("Canonical produzione non coerente");
for (const marker of [
  "og:title",
  "og:description",
  "og:image",
  "og:url",
  "twitter:card",
  'name="description"',
])
  if (!home.includes(marker))
    failures.push("Metadata richiesto mancante: " + marker);
if (
  !readFileSync(resolve("robots.txt"), "utf8").includes(
    "Sitemap: " + origin + "/sitemap.xml",
  )
)
  failures.push("Sitemap robots non coerente");
const sitemap = readFileSync(resolve("sitemap.xml"), "utf8");
for (const [, value] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g))
  if (!value.startsWith(origin + "/"))
    failures.push("URL sitemap fuori origine produzione");
if (!sitemap.includes("<loc>" + origin + "/</loc>"))
  failures.push("Homepage assente dalla sitemap");
if (!readFileSync(resolve("404.html"), "utf8").includes('content="noindex"'))
  failures.push("404 senza noindex");
if (/<script(?![^>]*application\/ld\+json)[^>]*>\s*[^<\s]/i.test(home))
  failures.push("JavaScript eseguibile inline");
// I contenuti didattici sono una bozza: non devono pubblicizzare offerte attive.
if (
  /20 €|25 €|30 €|200 €|10\s*\+\s*1 ore|https:\/\/wa\.me\//i.test(home) ||
  /"@type"\s*:\s*"(?:Offer|Service)"/.test(home)
)
  failures.push(
    "Homepage: vecchia offerta di ripetizioni o link commerciale rilevato",
  );
if (
  !home.includes("Sezione in lavorazione · Bozza") ||
  home.indexOf('id="formazione"') > home.indexOf('id="materie"')
)
  failures.push("Homepage: la bozza didattica deve seguire la formazione");
for (const match of home.matchAll(/<img\b[^>]*>/gi))
  if (!/\balt\s*=/.test(match[0]))
    failures.push("Homepage: immagine senza alt");
for (const match of home.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi))
  if (!/\brel=["'][^"']*(?:noopener|noreferrer)/i.test(match[0]))
    failures.push("Homepage: link esterno senza protezione opener");
if (/data:image\/[^;]+;base64/i.test(home))
  failures.push("Immagine Base64 ancora incorporata");
const patterns = [
  ["private key", /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/],
  [
    "GitHub token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/,
  ],
  [
    "API token",
    /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/,
  ],
  ["AWS key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
];
for (const path of files) {
  const name = relative(root, path).replaceAll("\\", "/");
  if (
    /(?:^|\/)(?:\.env(?!\.example)|id_rsa|id_ed25519|service[-_]?account|credentials?|secrets?)(?:\.|\/|$)|\.(?:pem|key|p12|pfx|sqlite|db|bak|backup|zip|7z|rar)$/i.test(
      name,
    )
  )
    failures.push("File riservato: " + name);
  if (
    !/\.(?:[cm]?js|ts|json|html|css|md|ya?ml|txt)$/.test(path) ||
    path.endsWith("check-links.mjs")
  )
    continue;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const [kind, pattern] of patterns) {
    const line = lines.findIndex((value) => pattern.test(value));
    if (line >= 0)
      failures.push(
        "Possibile " +
          kind +
          ": " +
          name +
          ":" +
          (line + 1) +
          " (valore non mostrato)",
      );
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  "Riferimenti, ancore, JSON-LD, SEO, sintassi JS e segreti: OK (" +
    files.length +
    " file).",
);
