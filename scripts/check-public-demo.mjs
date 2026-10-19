const targets = [
  {
    name: "Ripetizioni ChatGPT",
    url: "https://riccardo-buzzolan-ripetizioni-schio.riccardobb.chatgpt.site/",
  },
  {
    name: "Atlas Quest",
    url: "https://atlas-quest-beige.vercel.app/",
  },
];

for (const { name, url } of targets) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
    const html = await response.text();
    const content = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/\s+/g, " ");
    const title =
      html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] || "non trovato";
    const checks = {
      prezzi_visibili: /\b\d+(?:[.,]\d+)?\s*€|€\s*\d+/i.test(content),
      offerte_o_prenotazioni:
        /\b(?:tariffe|pacchetti|promozioni|prenota|chiedi disponibilit)/i.test(
          content,
        ),
      contatto_whatsapp: /wa\.me\//i.test(html),
      bozza_o_dimostrativo:
        /\b(?:bozza|dimostrativo|in lavorazione|servizio non attivo)\b/i.test(
          content,
        ),
      privacy_nel_documento: /privacy|cookie/i.test(content),
      robots_noindex: /<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html),
    };
    console.log(name + " HTTP " + response.status + " " + response.url);
    console.log("Titolo: " + title.trim().slice(0, 180));
    console.log("Controlli del markup pubblico: " + JSON.stringify(checks));
    console.log(
      "Testo disponibile nel documento: " +
        content.trim().length +
        " caratteri",
    );
  } catch (error) {
    console.warn(name + ": verifica non conclusa: " + error.message);
  }
}
