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
})();
