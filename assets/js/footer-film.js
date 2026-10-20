(() => {
  "use strict";
  const section = document.getElementById("video-finale");
  const video = section?.querySelector("video");
  if (!section || !video) return;
  video.addEventListener("loadeddata", () => {
    section.hidden = false;
    video.play().catch(() => {});
  });
  video.addEventListener("error", () => {
    section.hidden = true;
  });
})();
