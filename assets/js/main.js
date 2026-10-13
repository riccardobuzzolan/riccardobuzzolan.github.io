(() => {
  "use strict";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motion.matches;
  motion.addEventListener("change", (event) => {
    reducedMotion = event.matches;
  });
  const revealEls = [...document.querySelectorAll(".reveal")];
  const revealAll = () =>
    revealEls.forEach((el) => {
      el.classList.remove("is-pending");
      el.classList.add("visible");
    });
  if (reducedMotion || !("IntersectionObserver" in window)) revealAll();
  else
    try {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.12 },
      );
      revealEls.forEach((el) => {
        io.observe(el);
        el.classList.add("is-pending");
      });
      motion.addEventListener("change", () => {
        if (reducedMotion) {
          io.disconnect();
          revealAll();
        }
      });
    } catch {
      revealAll();
    }

  const video = document.querySelector(".hero-video");
  const videoToggle = document.querySelector("[data-video-toggle]");
  if (video && videoToggle) {
    let wantsPlayback = !reducedMotion;
    let videoVisible = true;
    const updateLabel = () => {
      videoToggle.hidden = !video.hasAttribute("src");
      videoToggle.textContent = video.paused
        ? "Riproduci il video"
        : "Metti in pausa il video";
      videoToggle.setAttribute("aria-pressed", String(!video.paused));
    };
    const syncVideo = () => {
      if (!video.hasAttribute("src")) { video.pause(); updateLabel(); return; }
      if (!wantsPlayback || !videoVisible || document.hidden) video.pause();
      else
        video.play().catch(() => {
          wantsPlayback = false;
          updateLabel();
        });
      updateLabel();
    };
    video.controls = false;
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("tabindex", "-1");
    videoToggle.hidden = false;
    videoToggle.addEventListener("click", () => {
      wantsPlayback = video.paused;
      syncVideo();
    });
    video.addEventListener("play", updateLabel);
    video.addEventListener("pause", updateLabel);
    video.addEventListener("error", () => {
      wantsPlayback = false;
      videoToggle.hidden = true;
    });
    document.addEventListener("visibilitychange", syncVideo);
    window.addEventListener("pageshow", syncVideo);
    window.addEventListener("pagehide", () => video.pause());
    motion.addEventListener("change", () => {
      if (reducedMotion) wantsPlayback = false;
      syncVideo();
    });
    if ("IntersectionObserver" in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        videoVisible = entries[0]?.isIntersecting ?? false;
        syncVideo();
      });
      videoObserver.observe(video);
    }
    document.addEventListener("siteprivacy:changed", (event) => {
      wantsPlayback = !!event.detail?.external && !reducedMotion;
      syncVideo();
    });
    syncVideo();
  }

  const PORTRAIT_SRC = "./assets/images/portrait.webp";
  class ParticlePortrait {
    constructor(canvas, source) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      if (!this.ctx) {
        canvas.hidden = true;
        return;
      }
      this.source = source;
      this.points = [];
      this.pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
      this.last = performance.now();
      this.frame = 0;
      this.visible = true;
      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas.parentElement);
      } else window.addEventListener("resize", () => this.resize());
      if ("IntersectionObserver" in window) {
        this.intersectionObserver = new IntersectionObserver(
          (es) => {
            this.visible = !!es[0]?.isIntersecting;
            this.wake();
          },
          { rootMargin: "140px" },
        );
        this.intersectionObserver.observe(canvas.parentElement);
      }
      this.bind();
      this.load();
    }
    bind() {
      const wrap = this.canvas.parentElement;
      document.addEventListener("visibilitychange", () => this.wake());
      motion.addEventListener("change", () => this.wake());
      window.addEventListener("pageshow", () => this.wake());
      window.addEventListener("pagehide", () => this.stop());
      wrap.addEventListener("pointerenter", () => (this.pointer.inside = true));
      wrap.addEventListener("pointerleave", () => {
        this.pointer.inside = false;
        this.pointer.tx = 0;
        this.pointer.ty = 0;
      });
      wrap.addEventListener(
        "pointermove",
        (e) => {
          if (reducedMotion) return;
          const r = wrap.getBoundingClientRect();
          this.pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          this.pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        },
        { passive: true },
      );
    }
    async load() {
      const img = new Image();
      img.src = this.source;
      try {
        await img.decode();
        if (!img.naturalWidth || !img.naturalHeight)
          throw new Error("Image unavailable");
        const off = document.createElement("canvas");
        off.width = img.naturalWidth;
        off.height = img.naturalHeight;
        const o = off.getContext("2d", { willReadFrequently: true });
        if (!o) throw new Error("Canvas unavailable");
        o.drawImage(img, 0, 0);
        const data = o.getImageData(0, 0, off.width, off.height).data,
          pts = [],
          step = 4;
        for (let y = 165; y < 532; y += step)
          for (let x = 130; x < 610; x += step) {
            const i = (y * off.width + x) * 4,
              r = data[i],
              g = data[i + 1],
              b = data[i + 2],
              green = g > 105 && g > r * 1.22 && g > b * 1.06 && g - r > 22;
            if (!green) continue;
            let allowed = false;
            if (y < 400) allowed = x > 245 && x < 492;
            else allowed = x > 145 && x < 590;
            if (y > 486 && x < 305) allowed = false;
            if (!allowed) continue;
            const nx = (x - 365) / 235;
            let z = 0;
            if (y < 400) {
              const hx = (x - 368) / 115,
                hy = (y - 285) / 120;
              z =
                58 *
                Math.sqrt(Math.max(0, 1 - hx * hx)) *
                (1 - Math.min(1, Math.abs(hy) * 0.36));
            } else z = 18 * (1 - Math.min(1, Math.abs(nx)));
            pts.push({
              x: (x - 145) / (590 - 145),
              y: (y - 165) / (532 - 165),
              z,
              phase: Math.random() * Math.PI * 2,
              s: 0.7 + Math.random() * 0.8,
            });
          }
        this.points = pts;
        this.resize();
      } catch {
        this.canvas.hidden = true;
        this.points = [];
        this.stop();
      }
    }
    resize() {
      const r = this.canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 1.55);
      this.canvas.width = Math.max(1, Math.round(r.width * dpr));
      this.canvas.height = Math.max(1, Math.round(r.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = r.width;
      this.h = r.height;
      this.wake();
    }
    stop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    wake() {
      this.stop();
      if (
        !this.points.length ||
        !this.w ||
        !this.h ||
        !this.visible ||
        document.hidden
      )
        return;
      if (reducedMotion) {
        this.pointer.x = this.pointer.y = 0;
        this.draw(0);
        return;
      }
      this.last = performance.now();
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }
    loop(now) {
      this.frame = 0;
      if (!this.visible || document.hidden || reducedMotion) return;
      if (now - this.last > 28) {
        const dt = Math.min(40, now - this.last);
        this.last = now;
        this.pointer.x +=
          (this.pointer.tx - this.pointer.x) * ((0.08 * dt) / 16.7);
        this.pointer.y +=
          (this.pointer.ty - this.pointer.y) * ((0.08 * dt) / 16.7);
        this.draw(now);
      }
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }
    draw(t) {
      if (!this.w || !this.h || !this.points.length) return;
      const c = this.ctx;
      c.clearRect(0, 0, this.w, this.h);
      const cx = this.w * 0.5,
        cy = this.h * 0.53,
        scale = Math.min(this.w / 1.04, this.h / 1.0),
        yaw = this.pointer.x * 0.34,
        pitch = -this.pointer.y * 0.22,
        sy = Math.sin(yaw),
        cyaw = Math.cos(yaw),
        sp = Math.sin(pitch),
        cp = Math.cos(pitch),
        mx = (this.pointer.x * 0.5 + 0.5) * this.w,
        my = (this.pointer.y * 0.5 + 0.5) * this.h,
        palette = ["#F6B36E", "#ED7A27", "#D75F12", "#171717"];
      for (const p of this.points) {
        let X = (p.x - 0.5) * scale * 0.92,
          Y = (p.y - 0.52) * scale * 0.78,
          Z = p.z + (reducedMotion ? 0 : Math.sin(t * 0.0014 + p.phase) * 2.4);
        const x1 = X * cyaw + Z * sy,
          z1 = -X * sy + Z * cyaw,
          y1 = Y * cp - z1 * sp,
          z2 = Y * sp + z1 * cp,
          perspective = 690 / (690 + z2);
        let sx = cx + x1 * perspective,
          syy = cy + y1 * perspective,
          dx = sx - mx,
          dy = syy - my,
          d = Math.hypot(dx, dy);
        if (this.pointer.inside && d < 145 && !reducedMotion) {
          const f = 1 - d / 145;
          sx += (dx / (d || 1)) * f * f * 22;
          syy += (dy / (d || 1)) * f * f * 22;
        }
        const ix = Math.max(
          0,
          Math.min(
            palette.length - 1,
            Math.floor((p.y * 0.72 + p.x * 0.28) * palette.length),
          ),
        );
        c.globalAlpha = 0.76 + Math.min(0.2, z2 / 300);
        c.fillStyle = palette[ix];
        c.beginPath();
        c.arc(
          sx,
          syy,
          Math.max(0.65, 1.55 * p.s * perspective),
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  const portrait = document.getElementById("portraitCanvas");
  if (portrait) new ParticlePortrait(portrait, PORTRAIT_SRC);
})();
