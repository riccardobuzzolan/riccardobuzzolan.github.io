/* Transparent hammerhead favicon: eight swimming poses, no icon rotation. */
(() => {
  "use strict";

  const icon = document.querySelector('link[rel="icon"][data-favicon-motion]');
  if (!icon || !window.matchMedia) return;

  const original = icon.getAttribute("href");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const blocked = () =>
    document.hidden || reduced.matches || navigator.connection?.saveData === true;
  const atlasUrl = "/shark-swim-atlas.png?v=hammerhead-transparent-swim-20261110-v8";
  const tile = 64;
  const count = 8;
  const delay = 125;
  const sequence = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];

  let frames = [];
  let index = 0;
  let timer = null;
  let preparing = false;

  function stop() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    index = 0;
    if (icon.getAttribute("href") !== original) {
      icon.setAttribute("href", original);
    }
  }

  function tick() {
    if (blocked()) {
      stop();
      return;
    }
    icon.setAttribute("href", frames[sequence[index]]);
    index = (index + 1) % sequence.length;
    timer = window.setTimeout(tick, delay);
  }

  function play() {
    if (blocked() || frames.length !== count) return;
    stop();
    tick();
  }

  async function prepare() {
    if (blocked() || preparing || frames.length === count) return;
    preparing = true;
    try {
      const sprite = new Image();
      sprite.decoding = "async";
      sprite.src = atlasUrl;
      if (sprite.decode) await sprite.decode();
      else await new Promise((resolve, reject) => {
        sprite.onload = resolve;
        sprite.onerror = reject;
      });
      if (sprite.naturalWidth !== tile * 4 || sprite.naturalHeight !== tile * 2) {
        throw new Error("Unexpected shark sprite dimensions");
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("Canvas not available");

      const nextFrames = [];
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
        nextFrames.push(canvas.toDataURL("image/png"));
      }

      frames = nextFrames;
      if (!blocked()) play();
    } catch {
      stop(); // Keep the transparent static PNG when animation is unsupported.
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
