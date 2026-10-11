# Riccardo Buzzolan

Sito personale statico, attualmente dedicato alle ripetizioni a Schio e online.
Produzione canonical: https://riccardobuzzolan.github.io/. GitHub Pages pubblica
la radice di main. Questo repository non è collegato a un progetto Vercel;
riccardo-buzzolan-portfolio.vercel.app appartiene al repository storico di redirect.

HTML, CSS e JavaScript nativi; nessun framework, backend, autenticazione,
database o variabile ambiente applicativa. Il sito non salva progressi o dati
personali e non registra un service worker. Il vecchio manifest e gli asset della
precedente interfaccia workspace sono stati rimossi perché non erano utilizzati.

## Struttura e dati

- index.html: contenuti, tariffe, contatti e metadata SEO/JSON-LD;
- assets/css/style.css: unico foglio di stile attivo, responsive;
- assets/js/main.js: animazioni progressive, video e ritratto decorativo;
- assets/images/portrait.webp: immagine originale del ritratto, estratta senza
  modifiche dalla precedente codifica Base64;
- favicon-animated.svg e favicon-motion.js: icona della scheda con movimento
  discreto e fallback locale;
- favicon e immagine social nella radice; 404.html, robots.txt, sitemap.xml;
- scripts/check-links.mjs: riferimenti, ancore, JSON-LD, SEO, sintassi JS e
  scansione dei segreti con messaggi che non ne mostrano i valori;
- tests/interactions.test.mjs: regressioni sui media decorativi e sulle animazioni.

Il video del martin pescatore resta ospitato su thinkingods.com. I font usano
la catena locale e di sistema dichiarata nel CSS: Google Fonts e le richieste
ai suoi domini sono stati rimossi. La sezione Memory Atlas incorpora
https://usa-memory-atlas.vercel.app/ in un iframe caricato vicino al viewport;
il collegamento a schermo intero resta disponibile. I contatti aprono WhatsApp
o il client email; le tesi aprono Google Drive. Contenuti e contatti della pagina
restano leggibili anche quando video, ritratto o servizi esterni non si caricano.

## Sviluppo e controlli

Con la versione Node indicata dal progetto, eseguire npm ci e avviare
python -m http.server 8000. Aprire http://localhost:8000/. Non esiste un bundle
da generare: i file sono pronti per un hosting statico.

Prima del commit eseguire npm run check e npm audit --audit-level=high.
Il primo comando verifica formattazione, lint dei due script del sito,
riferimenti locali/JSON-LD/SEO e regressioni dei media; i controlli singoli
restano disponibili con npm run format:check, npm run lint,
npm run check:links e npm test.
La CI deve verificare le dipendenze di sviluppo, perché sono gli unici pacchetti
Node del progetto. Il sito pubblicato non carica pacchetti npm.

## Accessibilità e media

Navigazione semantica e skip link; su schermi piccoli tutte le sezioni restano
raggiungibili nella barra orizzontale, anche da tastiera. Le rivelazioni animate
sono progressive: senza JavaScript il testo è visibile. La preferenza di movimento
ridotto mostra un ritratto statico e impedisce l'avvio automatico del video.
La preferenza si aggiorna anche mentre la pagina è aperta. Il pulsante video
consente una scelta esplicita; il media si ferma fuori viewport
o quando la scheda è nascosta. Anche il ciclo del canvas si arresta, evitando frame
inutili. Senza JavaScript il video conserva i controlli nativi e non parte da solo.
La favicon usa file locali e conserva un fallback quando il browser non permette
la conversione SVG/canvas. Il suo aggiornamento JavaScript si ferma con movimento
ridotto o scheda nascosta.

## Deploy e rollback

Lavorare su branch e PR; verificare CI e comportamento ai viewport 320, 375,
390, tablet e desktop prima del merge. Pages pubblica main; controllare il
workflow Pages e poi gli URL pubblici, inclusa una pagina inesistente.
Per rollback creare un revert del commit problematico tramite una nuova PR,
verificare la CI e attendere la successiva pubblicazione Pages. Non riscrivere
la cronologia e non eliminare gli hosting secondari degli altri repository.

GitHub Pages non permette di configurare liberamente header HTTP dal repository.
L'iframe Atlas richiede che il CSP dell'applicazione ospitata su Vercel ammetta
https://riccardobuzzolan.github.io come origine di incorporamento; questa regola
si configura nel repository Atlas, non in questo sito Pages.
Le protezioni del branch devono essere impostate nell'interfaccia GitHub quando
le autorizzazioni dell'integrazione non consentono di farlo.
