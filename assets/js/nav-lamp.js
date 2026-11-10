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
      <div class="lamp-showcase-links">
        <a href="#formazione">Formazione</a>
        <a href="#memory-atlas">Progetti</a>
        <a href="#materie">Ripetizioni</a>
        <a href="#contatti">Contatti</a>
      </div>
      <svg class="lamp-showcase-illustration" viewBox="0 0 1000 345" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="showcase-light" gradientUnits="userSpaceOnUse" x1="695" y1="119" x2="155" y2="96">
            <stop offset="0" stop-color="#fff5d9" stop-opacity=".76"/>
            <stop offset=".3" stop-color="#f6e3ff" stop-opacity=".42"/>
            <stop offset=".73" stop-color="#e5caf1" stop-opacity=".22"/>
            <stop offset="1" stop-color="#e5caf1" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="showcase-core" gradientUnits="userSpaceOnUse" x1="695" y1="119" x2="155" y2="96">
            <stop offset="0" stop-color="#fffefa" stop-opacity=".86"/>
            <stop offset=".32" stop-color="#fff9e7" stop-opacity=".42"/>
            <stop offset=".78" stop-color="#fff7eb" stop-opacity=".18"/>
            <stop offset="1" stop-color="#fff7eb" stop-opacity="0"/>
          </linearGradient>
          <radialGradient id="showcase-pool">
            <stop offset="0" stop-color="#fffdf3" stop-opacity=".96"/>
            <stop offset=".26" stop-color="#fff9eb" stop-opacity=".80"/>
            <stop offset=".6" stop-color="#f5e9fa" stop-opacity=".42"/>
            <stop offset="1" stop-color="#eadcf3" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="showcase-ambient">
            <stop offset="0" stop-color="#fff5e3" stop-opacity=".55"/>
            <stop offset=".6" stop-color="#e9d5f4" stop-opacity=".22"/>
            <stop offset="1" stop-color="#e9d5f4" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="showcase-shade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a89aad"/>
            <stop offset=".23" stop-color="#716679"/>
            <stop offset=".55" stop-color="#453b4d"/>
            <stop offset="1" stop-color="#211b29"/>
          </linearGradient>
          <linearGradient id="showcase-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#403843"/>
            <stop offset=".28" stop-color="#9f92a5"/>
            <stop offset=".52" stop-color="#5d5265"/>
            <stop offset="1" stop-color="#312a38"/>
          </linearGradient>
          <linearGradient id="showcase-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#756a79"/>
            <stop offset=".5" stop-color="#49404f"/>
            <stop offset="1" stop-color="#2e2835"/>
          </linearGradient>
          <filter id="showcase-ray-blur" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="15"/>
          </filter>
          <filter id="showcase-pool-blur" x="-35%" y="-55%" width="170%" height="210%">
            <feGaussianBlur stdDeviation="22"/>
          </filter>
          <filter id="showcase-bulb-blur" x="-180%" y="-180%" width="460%" height="460%">
            <feGaussianBlur stdDeviation="10"/>
          </filter>
        </defs>
        <ellipse data-lamp-ambient cx="155" cy="96" rx="223" ry="124" fill="url(#showcase-ambient)"/>
        <ellipse data-lamp-pool cx="155" cy="96" rx="158" ry="80" fill="url(#showcase-pool)" filter="url(#showcase-pool-blur)"/>
        <path data-lamp-haze fill="url(#showcase-light)" filter="url(#showcase-ray-blur)" d="M 695 96 L 155 8 Q 110 96 155 184 L 695 142 Z"/>
        <path class="lamp-showcase-ray" data-lamp-ray fill="url(#showcase-light)" d="M 695 109 L 155 30 Q 123 96 155 162 L 695 129 Z"/>
        <path data-lamp-core fill="url(#showcase-core)" d="M 695 113 L 155 65 Q 139 96 155 127 L 695 125 Z"/>
        <ellipse cx="812" cy="324" rx="138" ry="15" fill="#372f42" opacity=".12" filter="url(#showcase-pool-blur)"/>
        <ellipse cx="815" cy="304" rx="99" ry="17" fill="url(#showcase-base)"/>
        <ellipse cx="815" cy="296" rx="78" ry="8" fill="#aca0af" opacity=".36"/>
        <path d="M 815 292 L 865 194 L 784 107" fill="none" stroke="#2c2633" stroke-width="23" stroke-linecap="round" stroke-linejoin="round" opacity=".20"/>
        <path d="M 815 292 L 865 194 L 784 107" fill="none" stroke="url(#showcase-metal)" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 815 288 L 863 192 L 785 106" fill="none" stroke="#ded1dd" stroke-width="2.5" stroke-linecap="round" opacity=".67"/>
        <circle cx="865" cy="194" r="19" fill="#3b3441" stroke="#9d90a2" stroke-width="4"/>
        <circle cx="865" cy="194" r="9" fill="#64596b" stroke="#c5b8c9" stroke-width="2"/>
        <circle cx="865" cy="194" r="3.5" fill="#e5d8e5"/>
        <circle cx="784" cy="107" r="17" fill="#39313f" stroke="#9d90a2" stroke-width="4"/>
        <g data-lamp-head>
          <path d="M 785 103 L 735 94" fill="none" stroke="url(#showcase-metal)" stroke-width="18" stroke-linecap="round"/>
          <path d="M 784 99 L 739 90" fill="none" stroke="#e3d6e5" stroke-width="2.5" stroke-linecap="round" opacity=".56"/>
          <path d="M 734 68 Q 705 65 672 97 L 704 142 Q 736 127 748 98 Z" fill="url(#showcase-shade)" stroke="#352e3a" stroke-width="2"/>
          <path d="M 735 73 Q 710 71 686 95" fill="none" stroke="#f3e7f1" stroke-width="3" stroke-linecap="round" opacity=".65"/>
          <ellipse cx="695" cy="119" rx="16" ry="24" transform="rotate(-35 695 119)" fill="#f3dfd1" stroke="#4c4252" stroke-width="5"/>
          <ellipse cx="695" cy="119" rx="11" ry="18" transform="rotate(-35 695 119)" fill="#fff6dc"/>
          <circle cx="695" cy="119" r="15" fill="#fff4cf" opacity=".53" filter="url(#showcase-bulb-blur)"/>
          <circle cx="693" cy="119" r="6" fill="#fffefa"/>
        </g>
        <circle cx="784" cy="107" r="5.5" fill="#c8bbcc"/>
        <circle cx="784" cy="107" r="2.5" fill="#f5e9f5"/>
      </svg>`;
    hero.insertAdjacentElement("afterend", panel);

    const choices = [...panel.querySelectorAll(".lamp-showcase-links a")];
    const ray = panel.querySelector("[data-lamp-ray]");
    const haze = panel.querySelector("[data-lamp-haze]");
    const core = panel.querySelector("[data-lamp-core]");
    const pool = panel.querySelector("[data-lamp-pool]");
    const ambient = panel.querySelector("[data-lamp-ambient]");
    const head = panel.querySelector("[data-lamp-head]");
    const gradients = [
      panel.querySelector("#showcase-light"),
      panel.querySelector("#showcase-core"),
    ];
    const current = { x: 155, y: 96 };
    const target = { x: 155, y: 96 };
    let beamFrame = 0;
    let activeChoice = choices[0];
    let pointerInside = false;
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const fmt = (n) => n.toFixed(1);
    const cone = (sx, sy, tx, ty, near, far) => {
      const dx = tx - sx;
      const dy = ty - sy;
      const length = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / length;
      const uy = dy / length;
      const nx = -uy;
      const ny = ux;
      return (
        "M " + fmt(sx + nx * near) + " " + fmt(sy + ny * near) +
        " L " + fmt(tx + nx * far) + " " + fmt(ty + ny * far) +
        " Q " + fmt(tx + ux * 26) + " " + fmt(ty + uy * 26) +
        " " + fmt(tx - nx * far) + " " + fmt(ty - ny * far) +
        " L " + fmt(sx - nx * near) + " " + fmt(sy - ny * near) + " Z"
      );
    };
    const drawLight = () => {
      beamFrame = 0;
      const ease = reducedMotion.matches ? 1 : 0.19;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      // The lamp head tilts toward the illuminated point.
      const originalAngle = Math.atan2(12, -89);
      const focusAngle = Math.atan2(current.y - 119, current.x - 695);
      const angleDelta = Math.atan2(
        Math.sin(focusAngle - originalAngle),
        Math.cos(focusAngle - originalAngle),
      );
      const degrees = clamp((angleDelta * 180) / Math.PI, -15, 17);
      const radians = (degrees * Math.PI) / 180;
      head.setAttribute("transform", "rotate(" + fmt(degrees) + " 784 107)");
      const sx = 784 - 89 * Math.cos(radians) - 12 * Math.sin(radians);
      const sy = 107 - 89 * Math.sin(radians) + 12 * Math.cos(radians);
      ray.setAttribute("d", cone(sx, sy, current.x, current.y, 13, 66));
      haze.setAttribute("d", cone(sx, sy, current.x, current.y, 23, 108));
      core.setAttribute("d", cone(sx, sy, current.x, current.y, 6, 32));
      gradients.forEach((gradient) => {
        gradient.setAttribute("x1", fmt(sx));
        gradient.setAttribute("y1", fmt(sy));
        gradient.setAttribute("x2", fmt(current.x));
        gradient.setAttribute("y2", fmt(current.y));
      });
      pool.setAttribute("cx", fmt(current.x));
      pool.setAttribute("cy", fmt(current.y));
      ambient.setAttribute("cx", fmt(current.x + 22));
      ambient.setAttribute("cy", fmt(current.y));
      if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.55) {
        beamFrame = requestAnimationFrame(drawLight);
      }
    };
    const requestLight = () => {
      if (!beamFrame) beamFrame = requestAnimationFrame(drawLight);
    };
    const aimAtLink = (link) => {
      if (!link) return;
      const panelRect = panel.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      if (!panelRect.width || !panelRect.height) return;
      target.x = clamp(
        ((linkRect.left + linkRect.width / 2 - panelRect.left) / panelRect.width) * 1000,
        80, 440,
      );
      target.y = clamp(
        ((linkRect.top + linkRect.height / 2 - panelRect.top) / panelRect.height) * 345,
        43, 302,
      );
      requestLight();
    };
    const activate = (link) => {
      if (!choices.includes(link)) return;
      activeChoice = link;
      choices.forEach((item) => item.classList.toggle("is-lit", item === link));
      if (!pointerInside) aimAtLink(link);
    };
    choices.forEach((link) => {
      link.addEventListener("pointerenter", () => activate(link));
      link.addEventListener("focus", () => {
        pointerInside = false;
        activate(link);
      });
      link.addEventListener("click", () => activate(link));
    });
    panel.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerInside = true;
      target.x = clamp(((event.clientX - rect.left) / rect.width) * 1000, 80, 440);
      target.y = clamp(((event.clientY - rect.top) / rect.height) * 345, 43, 302);
      requestLight();
    }, { passive: true });
    panel.addEventListener("pointerleave", () => {
      pointerInside = false;
      aimAtLink(activeChoice);
    });
    window.addEventListener("resize", () => {
      if (!pointerInside) aimAtLink(activeChoice);
    }, { passive: true });
    activate(choices[0]);
  }
})();
