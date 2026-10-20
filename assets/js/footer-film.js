(() => {
  "use strict";
  document.querySelectorAll(".footer-film-video").forEach((video) => {
    const frame = video.closest("[data-video-option]");
    if (!frame) return;
    video.addEventListener("error", () => {
      frame.classList.add("video-unavailable");
    });
    video.addEventListener("loadeddata", () => {
      frame.classList.remove("video-unavailable");
      video.play().catch(() => {});
    });
  });
})();
