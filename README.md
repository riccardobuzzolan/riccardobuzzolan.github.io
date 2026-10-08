# RB Workspace

Portfolio statico di Riccardo Buzzolan.

Produzione: https://riccardobuzzolan.github.io/

Stack: HTML, CSS e JavaScript nativi. Non richiede backend, autenticazione o variabili ambiente applicative.

## Struttura

- `index.html`: contenuti e metadata SEO;
- `assets/css/style.css`: stili responsive;
- `assets/js/main.js`: interazioni;
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`: distribuzione e navigazione;
- `scripts/check-links.mjs`: verifica riferimenti locali e JSON-LD.

## Sviluppo

```bash
npm ci
python -m http.server 8000
```

Aprire poi http://localhost:8000/.

## Controlli

```bash
npm test
npm run check:links
```

La CI esegue anche l'audit delle dipendenze di produzione.

## Deploy

GitHub Pages pubblica la radice del branch `main`. Gli embed Figma, Substack e Notion restano servizi esterni e devono degradare in modo leggibile se non disponibili.

## Dati

Il sito non usa database. Le richieste di contatto aprono servizi esterni o il client email e non richiedono credenziali nel repository.
