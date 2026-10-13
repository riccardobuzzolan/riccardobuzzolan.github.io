(() => {
  "use strict";
  const site =
    document.querySelector("script[data-privacy-site]")?.dataset.privacySite ||
    "website";
  const KEY = "richi-privacy-" + site + "-v1";
  const AGE = 180 * 24 * 60 * 60 * 1000;
  const banner = document.getElementById("sitePrivacyBanner");
  const choices = document.getElementById("sitePrivacyOptions");
  const input = document.getElementById("sitePrivacyExternal");
  const customize = document.getElementById("sitePrivacyCustomize");
  const save = document.getElementById("sitePrivacySave");
  const accept = document.getElementById("sitePrivacyAccept");
  const reject = document.getElementById("sitePrivacyReject");
  const close = document.getElementById("sitePrivacyClose");
  if (!banner) return;

  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      saved &&
      typeof saved.external === "boolean" &&
      Number.isFinite(saved.at) &&
      saved.at <= Date.now() &&
      Date.now() - saved.at < AGE
    )
      choice = saved.external;
  } catch {
    /* Disabled browser storage: consent must be requested again. */
  }

  function open() {
    banner.hidden = false;
    if (input) input.checked = choice === true;
    reject?.focus();
  }
  function showPlaceholder(frame) {
    const existing = frame.nextElementSibling;
    if (existing?.classList.contains("privacy-placeholder")) return existing;
    const content = document.createElement("div");
    content.className = "privacy-placeholder";
    const heading = document.createElement("strong");
    heading.textContent = "Anteprima esterna";
    const description = document.createElement("span");
    description.textContent =
      "Per mostrare questo contenuto serve il consenso.";
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = "Preferenze privacy";
    action.addEventListener("click", open);
    content.append(heading, description, action);
    frame.insertAdjacentElement("afterend", content);
    return content;
  }
  function apply() {
    const allowed = choice === true;
    document.documentElement.dataset.externalConsent = allowed
      ? "granted"
      : "denied";
    document.querySelectorAll("iframe[data-privacy-src]").forEach((frame) => {
      const placeholder = showPlaceholder(frame);
      if (allowed) {
        if (!frame.hasAttribute("src"))
          frame.setAttribute("src", frame.dataset.privacySrc);
      } else frame.removeAttribute("src");
      frame.style.display = allowed ? "" : "none";
      placeholder.hidden = allowed;
    });
    document.querySelectorAll("video[data-privacy-src]").forEach((video) => {
      if (allowed && !video.hasAttribute("src")) {
        video.src = video.dataset.privacySrc;
        video.load();
      } else if (!allowed && video.hasAttribute("src")) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      video.style.visibility = allowed ? "" : "hidden";
    });
    document.dispatchEvent(
      new CustomEvent("siteprivacy:changed", { detail: { external: allowed } }),
    );
  }
  function choose(allow) {
    choice = allow;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ external: allow, at: Date.now() }),
      );
    } catch {
      /* Session choice still applies. */
    }
    apply();
    banner.hidden = true;
  }
  accept?.addEventListener("click", () => choose(true));
  reject?.addEventListener("click", () => choose(false));
  close?.addEventListener("click", () => choose(false));
  save?.addEventListener("click", () => choose(!!input?.checked));
  customize?.addEventListener("click", () => {
    if (!choices) return;
    choices.hidden = !choices.hidden;
    save.hidden = choices.hidden;
    accept.hidden = !choices.hidden;
    customize.setAttribute("aria-expanded", String(!choices.hidden));
  });
  document
    .querySelectorAll("[data-privacy-open]")
    .forEach((button) => button.addEventListener("click", open));
  apply();
  if (choice === null) banner.hidden = false;
})();
