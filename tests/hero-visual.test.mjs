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
  assert.match(html, /data-privacy-src="https:\/\/thinkingods\.com\/demos\/kingfisher-hero\/hero\.mp4"/);
  assert.doesNotMatch(mediaCSS, /\.hero-media-fallback\s*>\s*\*\s*\{\s*display:\s*none/);
});

test("bird video no longer obscures the whole opening screen", () => {
  assert.doesNotMatch(mediaCSS, /Full-screen kingfisher hero/);
  assert.match(mediaCSS, /grid-column:\s*2/);
  assert.match(themeCSS, /\.hero\s*\{\s*background:\s*#ffffff !important;/);
  assert.match(themeCSS, /\.hero \.hero-media \.hero-media-fallback\s*\{/);
  assert.match(themeCSS, /\.hero \.hero-media \.hero-media-action\s*\{/);
});

test("premium hero keeps dark type and mobile fallback usable", () => {
  assert.match(themeCSS, /\.hero \.hero-copy h1 \.hero-place/);
  assert.match(themeCSS, /\.hero \.hero-media \.hero-media-title\s*\{\s*color:\s*#171717/);
  assert.match(themeCSS, /height:\s*clamp\(340px, 88vw, 430px\)/);
  assert.match(themeCSS, /prefers-reduced-motion:\s*reduce/);
});
