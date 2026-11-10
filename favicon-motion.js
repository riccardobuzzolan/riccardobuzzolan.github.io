/* Animated favicon: real hammerhead swimming frames, never rotating the icon. */
(() => {
  "use strict";

  const icon = document.querySelector('link[rel="icon"][data-favicon-motion]');
  if (!icon || !window.matchMedia) return;

  const original = icon.getAttribute("href");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const blocked = () =>
    document.hidden || reduced.matches || navigator.connection?.saveData === true;
  const source = "/shark-swim-atlas.png?v=hammerhead-swim-20261110-v7";
  const count = 8;
  const tile = 48;
  const delay = 120;
  let frames = [];
  let index = 0;
  let timer = null;
  let preparing = false;
  let disposed = false;

  function stop() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    index = 0;
    icon.setAttribute("href", original);
  }

  function tick() {
    if (disposed || blocked()) {
      stop();
      return;
    }
    icon.setAttribute("href", frames[index]);
    index = (index + 1) % count;
    timer = window.setTimeout(tick, delay);
  }

  function play() {
    if (disposed || blocked() || frames.length !== count) return;
    stop();
    tick();
  }

  async function prepare() {
    if (disposed || blocked() || preparing || frames.length === count) return;
    preparing = true;
    try {
      const sprite = new Image();
      sprite.decoding = "async";
      sprite.src = source;
      await sprite.decode();
      if (sprite.naturalWidth !== tile * 4 || sprite.naturalHeight !== tile * 2) {
        throw new Error("Unexpected favicon animation dimensions");
      }
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas unavailable");
      const next = [];
      for (let i = 0; i < count; i += 1) {
        ctx.clearRect(0, 0, 96, 96);
        ctx.drawImage(
          sprite,
          (i % 4) * tile,
          Math.floor(i / 4) * tile,
          tile,
          tile,
          0,
          0,
          96,
          96,
        );
        next.push(canvas.toDataURL("image/png"));
      }
      if (disposed) return;
      frames = next;
      play();
    } catch {
      stop(); // Keep the static image if this browser cannot animate favicons.
    } finally {
      preparing = false;
    }
  }

  function sync() {
    if (blocked()) stop();
    else if (frames.length === count) play();
    else prepare();
  }

  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener?.("change", sync);
  window.addEventListener("pageshow", sync);
  window.addEventListener("pagehide", stop);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepare, { once: true });
  } else {
    prepare();
  }
})();
