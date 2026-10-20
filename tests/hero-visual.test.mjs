import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mediaCSS = readFileSync(
  new URL("../assets/css/kingfisher-hero.css", import.meta.url),
  "utf8",
);
const themeCSS = readFileSync(
  new URL("../assets/css/premium-monochrome.css", import.meta.url),
  "utf8",
);

test("hero offers a visible consent action before external video loads", () => {
  assert.match(html, /data-video-state="consent"/);
  assert.match(html, /data-video-action/);
  assert.match(html, /data-video-message/);
  assert.match(
    html,
    /data-privacy-src="https:\/\/thinkingods\.com\/demos\/kingfisher-hero\/hero\.mp4"/,
  );
  assert.doesNotMatch(
    mediaCSS,
    /\.hero-media-fallback\s*>\s*\*\s*\{\s*display:\s*none/,
  );
});

test("borderless bird video occupies a larger split hero", () => {
  assert.doesNotMatch(mediaCSS, /Full-screen kingfisher hero/);
  assert.match(mediaCSS, /grid-column:\s*2/);
  assert.match(
    themeCSS,
    /\.hero\s*\{[^}]*height:\s*clamp\(570px, 76svh, 665px\)/,
  );
  assert.match(
    themeCSS,
    /\.hero \.hero-media\s*\{[^}]*border:\s*0;[^}]*border-radius:\s*0;/,
  );
  assert.match(themeCSS, /\.hero \.hero-media \.hero-media-fallback\s*\{/);
});

test("video uses only its playback toggle, without decorative labels", () => {
  assert.doesNotMatch(html, /class="hero-media-(?:caption|eyebrow|title)"/);
  assert.match(html, /data-video-toggle/);
  assert.match(html, /data-video-action/);
  assert.match(themeCSS, /\.hero \.hero-media \.video-toggle\s*\{/);
});

test("fiscal preview begins sooner and pastel accents stay in place", () => {
  assert.match(html, /id="progetto-scadenze-fiscali"/);
  assert.match(themeCSS, /margin:\s*12px auto 56px/);
  assert.match(themeCSS, /text-decoration-color:\s*var\(--accent-lilac\)/);
  assert.match(themeCSS, /height:\s*clamp\(265px, 70vw, 350px\)/);
  assert.match(themeCSS, /prefers-reduced-motion:\s*reduce/);
});
