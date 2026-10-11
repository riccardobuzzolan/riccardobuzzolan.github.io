import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(
  new URL("../assets/js/main.js", import.meta.url),
  "utf8",
);

class Element {
  constructor() {
    this.listeners = new Map();
    this.attributes = new Map();
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
    };
  }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  emit(type, event = {}) {
    this.listeners.get(type)?.forEach((callback) => callback(event));
  }
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  getBoundingClientRect() {
    return { width: 500, height: 400, left: 0, top: 0 };
  }
}

async function setup({
  reduced = false,
  imageFails = false,
  noCanvas = false,
  noObservers = false,
} = {}) {
  const motion = new Element();
  motion.matches = reduced;
  const document = new Element();
  document.hidden = false;
  const reveal = new Element();
  const canvas = new Element();
  canvas.parentElement = new Element();
  let draws = 0;
  const context = {
    setTransform() {},
    clearRect() {},
    beginPath() {},
    fill() {},
    arc() {
      draws++;
    },
  };
  canvas.getContext = () => (noCanvas ? null : context);
  const video = new Element();
  video.paused = true;
  video.play = () => {
    video.paused = false;
    video.emit("play");
    return Promise.resolve();
  };
  video.pause = () => {
    video.paused = true;
    video.emit("pause");
  };
  const toggle = new Element();
  document.querySelectorAll = () => [reveal];
  document.querySelector = (selector) =>
    selector === ".hero-video" ? video : toggle;
  document.getElementById = () => canvas;
  document.createElement = () => ({
    getContext: () => ({
      drawImage() {},
      getImageData: () => {
        const data = new Uint8ClampedArray(700 * 600 * 4);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 10;
          data[i + 1] = 200;
          data[i + 2] = 20;
          data[i + 3] = 255;
        }
        return { data };
      },
    }),
  });
  const observers = [];
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observers.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    disconnect() {
      this.targets = [];
    }
    visible(value) {
      this.callback([{ target: this.targets[0], isIntersecting: value }]);
    }
  }
  const frames = new Map();
  let nextFrame = 1;
  const window = new Element();
  Object.assign(window, {
    document,
    Image: class {
      naturalWidth = 700;
      naturalHeight = 600;
      decode() {
        return imageFails
          ? Promise.reject(new Error("Unavailable"))
          : Promise.resolve();
      }
    },
    matchMedia: () => motion,
    performance: { now: () => 0 },
    devicePixelRatio: 1,
    requestAnimationFrame: (callback) => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  if (!noObservers) {
    window.IntersectionObserver = class extends Observer {
      kind = "intersection";
    };
    window.ResizeObserver = class extends Observer {
      kind = "resize";
    };
  }
  window.window = window;
  vm.runInNewContext(source, window);
  await new Promise(setImmediate);
  return {
    window,
    document,
    motion,
    video,
    toggle,
    canvas,
    reveal,
    frames,
    observers,
    draws: () => draws,
  };
}

test("reduced motion prevents autoplay and draws a static portrait without frames", async () => {
  const app = await setup({ reduced: true });
  assert.equal(app.video.paused, true);
  assert.equal(app.frames.size, 0);
  assert.ok(app.draws() > 0);
  assert.ok(app.reveal.classes.has("visible"));
  app.toggle.emit("click");
  assert.equal(app.video.paused, false, "explicit play remains available");
  assert.equal(app.frames.size, 0);
});

test("visibility and viewport changes stop frames and resume one loop", async () => {
  const app = await setup();
  assert.equal(app.frames.size, 1);
  app.document.hidden = true;
  app.document.emit("visibilitychange");
  assert.equal(app.frames.size, 0);
  assert.equal(app.video.paused, true);
  app.document.hidden = false;
  app.document.emit("visibilitychange");
  assert.equal(app.frames.size, 1);
  const portraitObserver = app.observers.find(
    (observer) =>
      observer.kind === "intersection" &&
      observer.targets.includes(app.canvas.parentElement),
  );
  portraitObserver.visible(false);
  assert.equal(app.frames.size, 0);
  portraitObserver.visible(true);
  app.window.emit("pageshow");
  app.window.emit("pageshow");
  assert.equal(app.frames.size, 1, "resume must not create duplicate loops");
  app.window.emit("pagehide");
  assert.equal(app.frames.size, 0);
});

test("changing motion preference stops a running animation and media", async () => {
  const app = await setup();
  app.motion.matches = true;
  app.motion.emit("change", { matches: true });
  assert.equal(app.frames.size, 0);
  assert.equal(app.video.paused, true);
  assert.ok(app.reveal.classes.has("visible"));
  app.motion.matches = false;
  app.motion.emit("change", { matches: false });
  assert.equal(app.frames.size, 1);
  assert.equal(
    app.video.paused,
    true,
    "motion preference change must not override the user's paused state",
  );
});

test("motion changes use the event state throughout media and portrait updates", async () => {
  const app = await setup();
  Object.defineProperty(app.motion, "matches", {
    get() {
      throw new Error(
        "The live query must not be polled during animation updates",
      );
    },
  });
  app.motion.emit("change", { matches: true });
  assert.equal(app.video.paused, true);
  assert.equal(app.frames.size, 0);
  const drawsBefore = app.draws();
  app.document.emit("visibilitychange");
  assert.ok(app.draws() > drawsBefore, "the static portrait remains available");
  assert.equal(app.frames.size, 0);
  app.motion.emit("change", { matches: false });
  assert.equal(app.frames.size, 1);
  assert.equal(app.video.paused, true);
});

test("manual video pause survives leaving and returning to the viewport", async () => {
  const app = await setup();
  assert.equal(app.video.paused, false);
  app.toggle.emit("click");
  const observer = app.observers.find((candidate) =>
    candidate.targets.includes(app.video),
  );
  observer.visible(false);
  observer.visible(true);
  assert.equal(app.video.paused, true);
  assert.equal(app.toggle.attributes.get("aria-pressed"), "false");
});

test("unavailable portrait image fails safely without an animation loop", async () => {
  const app = await setup({ imageFails: true });
  assert.equal(app.canvas.hidden, true);
  assert.equal(app.frames.size, 0);
});

test("canvas or observer absence does not prevent the page and contacts from working", async () => {
  const noCanvas = await setup({ noCanvas: true });
  assert.equal(noCanvas.canvas.hidden, true);
  assert.equal(noCanvas.frames.size, 0);
  const noObservers = await setup({ noObservers: true });
  assert.ok(noObservers.reveal.classes.has("visible"));
  assert.equal(noObservers.frames.size, 1);
});
