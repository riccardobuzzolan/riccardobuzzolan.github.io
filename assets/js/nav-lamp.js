(() => {
  "use strict";
  const nav = document.querySelector(".nav-links");
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  if (!links.length) return;

  const desktop = window.matchMedia("(min-width: 901px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lamp = document.createElement("span");
  lamp.className = "nav-lamp";
  lamp.setAttribute("aria-hidden", "true");
  lamp.innerHTML = '<span class="lamp-cord"></span><span class="lamp-shade"></span><span class="lamp-beam"></span>';
  nav.classList.add("lamp-nav");
  nav.prepend(lamp);

  let selected = links[0];
  let hovering = false;
  let frame = 0;
  const setActive = (link) => {
    if (!link) return;
    links.forEach((item) => item.classList.toggle("lamp-active", item === link));
    if (!desktop.matches) return;
    const bounds = nav.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    if (!bounds.width || !target.width) return;
    const x = target.left - bounds.left + target.width / 2 - 17;
    nav.style.setProperty("--lamp-x", x.toFixed(2) + "px");
    nav.classList.add("lamp-ready");
  };
  const schedule = (link) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => setActive(link));
  };
  const currentFromHash = () =>
    links.find((link) => link.hash === window.location.hash) || links[0];
  selected = currentFromHash();

  links.forEach((link) => {
    link.addEventListener("pointerenter", (event) => {
      if (!desktop.matches || event.pointerType === "touch") return;
      hovering = true;
      schedule(link);
    });
    link.addEventListener("focus", () => {
      hovering = true;
      schedule(link);
    });
    link.addEventListener("click", () => {
      selected = link;
      hovering = false;
      schedule(link);
    });
  });
  nav.addEventListener("pointerleave", () => {
    hovering = false;
    schedule(selected);
  });
  nav.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      if (!nav.contains(document.activeElement)) {
        hovering = false;
        schedule(selected);
      }
    });
  });
  window.addEventListener("hashchange", () => {
    selected = currentFromHash();
    if (!hovering) schedule(selected);
  });
  window.addEventListener("resize", () => schedule(selected), { passive: true });
  desktop.addEventListener("change", () => schedule(selected));
  if (reducedMotion.matches) nav.classList.add("lamp-reduced-motion");
  schedule(selected);

  /* Reference-inspired desk lamp. Kept separate from the existing hero. */
  const hero = document.querySelector(".hero--ascii");
  if (hero) {
    const panel = document.createElement("section");
    panel.className = "lamp-showcase";
    panel.setAttribute("aria-label", "Esplora il portfolio con la lampada interattiva");
    panel.innerHTML = `
      <p class="lamp-showcase-label">ESPLORA IL PORTFOLIO · SPOSTA IL CURSORE</p>
      <div class="lamp-showcase-links">
        <a href="#formazione">Formazione</a>
        <a href="#memory-atlas">Progetti</a>
        <a href="#materie">Ripetizioni</a>
        <a href="#contatti">Contatti</a>
      </div>
      <svg class="lamp-showcase-illustration" viewBox="0 0 1000 345" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="showcase-light" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stop-color="#c9a6e6" stop-opacity=".55"/>
            <stop offset="1" stop-color="#d8c2ed" stop-opacity=".08"/>
          </linearGradient>
          <linearGradient id="showcase-shade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#514956"/><stop offset="1" stop-color="#24202a"/>
          </linearGradient>
        </defs>
        <path class="lamp-showcase-ray" data-lamp-ray fill="url(#showcase-light)" d="M 700 118 L 140 75 Q 95 112 140 149 Z"/>
        <ellipse cx="815" cy="317" rx="107" ry="12" fill="#b4a5bd" opacity=".16"/>
        <ellipse cx="815" cy="302" rx="92" ry="16" fill="#45404b"/>
        <ellipse cx="815" cy="296" rx="76" ry="11" fill="#615b69"/>
        <path class="lamp-metal" d="M 815 292 L 865 194 L 784 107"/>
        <path d="M 815 292 L 865 194 L 784 107" fill="none" stroke="#c2b6ca" stroke-width="6" stroke-linecap="round"/>
        <circle cx="865" cy="194" r="19" fill="#36323c" stroke="#a99daf" stroke-width="5"/>
        <circle cx="784" cy="107" r="17" fill="#36323c" stroke="#a99daf" stroke-width="5"/>
        <path d="M 785 103 L 735 94" stroke="#48414d" stroke-width="18" stroke-linecap="round"/>
        <path d="M 734 68 Q 705 65 672 97 L 704 142 Q 736 127 748 98 Z" fill="url(#showcase-shade)"/>
        <ellipse cx="695" cy="119" rx="16" ry="24" transform="rotate(-35 695 119)" fill="#d9c6e7" stroke="#575060" stroke-width="5"/>
        <circle cx="865" cy="194" r="6" fill="#c6b4d0"/>
      </svg>`;
    hero.insertAdjacentElement("afterend", panel);

    const choices = [...panel.querySelectorAll(".lamp-showcase-links a")];
    const ray = panel.querySelector("[data-lamp-ray]");
    const activate = (link) => {
      const idx = choices.indexOf(link);
      if (idx < 0) return;
      choices.forEach((item) => item.classList.toggle("is-lit", item === link));
      const y = 117 + 51 * idx;
      ray.setAttribute("d", `M 700 118 L 145 ${y - 32} Q 108 ${y} 145 ${y + 32} Z`);
    };
    choices.forEach((link) => {
      link.addEventListener("pointerenter", () => activate(link));
      link.addEventListener("focus", () => activate(link));
      link.addEventListener("click", () => activate(link));
    });
    activate(choices[0]);
  }
})();
