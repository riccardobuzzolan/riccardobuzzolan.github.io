/* Animated hammerhead favicon: swimming in a circle, with a moving tail. */
(() => {
  "use strict";
  const icon = document.querySelector('link[rel="icon"][data-favicon-motion]');
  if (!icon || !window.matchMedia || !window.fetch || !window.DOMParser) return;
  const original = icon.getAttribute("href");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const blocked = () => document.hidden || reduced.matches || navigator.connection?.saveData === true;
  const frameCount = 54;
  const frameDelay = 105;
  let frames = [];
  let timer = null;
  let index = 0;
  let preparing = false;
  let disposed = false;

  function stop() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    index = 0;
    if (icon.getAttribute("href") !== original) icon.setAttribute("href", original);
  }

  function tick() {
    if (disposed || blocked()) { stop(); return; }
    icon.setAttribute("href", frames[index]);
    index = (index + 1) % frames.length;
    timer = window.setTimeout(tick, frameDelay);
  }

  function play() {
    if (disposed || blocked() || frames.length !== frameCount) return;
    stop();
    tick();
  }

  async function createFrames() {
    if (preparing || disposed || blocked()) return;
    preparing = true;
    try {
      const response = await fetch(original, { cache: "force-cache" });
      if (!response.ok) throw new Error("Favicon unavailable");
      const source = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      if (source.querySelector("parsererror")) throw new Error("Invalid favicon SVG");
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx || !canvas.toDataURL) throw new Error("Canvas unavailable");
      const next = [];
      for (let i = 0; i < frameCount; i += 1) {
        if (disposed || blocked()) return;
        const t = (i / frameCount) * Math.PI * 2;
        const svg = source.documentElement.cloneNode(true);
        const shark = svg.querySelector("#shark");
        const tail = svg.querySelector("#tail");
        if (!shark || !tail) throw new Error("Missing hammerhead shape");
        const dx = (6 * Math.sin(t)).toFixed(3);
        const dy = (-6 * Math.cos(t)).toFixed(3);
        const heading = (90 + (t * 180) / Math.PI).toFixed(3);
        shark.setAttribute("transform",
          "translate(" + dx + " " + dy + ") rotate(" + heading +
          " 32 32) translate(32 32) scale(.78) translate(-32 -32)");
        tail.setAttribute("transform",
          "rotate(" + (11 * Math.sin(t * 6)).toFixed(2) + " 32 48)");
        const serialized = new XMLSerializer().serializeToString(svg);
        const frame = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            ctx.clearRect(0, 0, 96, 96);
            ctx.drawImage(image, 0, 0, 96, 96);
            resolve(canvas.toDataURL("image/png"));
          };
          image.onerror = () => reject(new Error("Cannot render favicon frame"));
          image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialized);
        });
        next.push(frame);
      }
      frames = next;
      play();
    } catch { stop(); }
    finally { preparing = false; }
  }

  function sync() {
    if (blocked()) stop();
    else if (frames.length === frameCount) play();
    else createFrames();
  }

  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener?.("change", sync);
  window.addEventListener("pagehide", () => { disposed = true; stop(); });
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", createFrames, { once: true });
  else createFrames();
})();
