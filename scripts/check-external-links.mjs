import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const urls = [
  ...html.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi),
  ...html.matchAll(/\bdata-privacy-src=["'](https?:\/\/[^"']+)["']/gi),
].map((match) => match[1]);
const unique = [...new Set(urls)];
const warnings = [];
const broken = [];

async function check(url) {
  const options = {
    method: "HEAD",
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
    headers: { "User-Agent": "PersonalPortfolioLinkAudit/1.0" },
  };
  let response;
  try {
    response = await fetch(url, options);
    if ([403, 404, 405, 410].includes(response.status)) {
      response = await fetch(url, {
        ...options,
        method: "GET",
        headers: { ...options.headers, Range: "bytes=0-0" },
        signal: AbortSignal.timeout(12000),
      });
      await response.body?.cancel();
    }
  } catch (error) {
    warnings.push(url + " (non verificabile: " + error.message + ")");
    return;
  }
  if ([404, 410].includes(response.status)) {
    broken.push(url + " (HTTP " + response.status + ")");
  } else if (!response.ok) {
    warnings.push(url + " (HTTP " + response.status + ")");
  } else {
    console.log("OK " + response.status + " " + url);
  }
}

await Promise.all(unique.map(check));
for (const warning of warnings) console.warn("DA VERIFICARE " + warning);
for (const link of broken) console.error("LINK NON TROVATO " + link);
console.log(
  "Collegamenti esterni: " +
    unique.length +
    " controllati, " +
    broken.length +
    " assenti, " +
    warnings.length +
    " non verificabili.",
);
if (broken.length) process.exitCode = 1;
