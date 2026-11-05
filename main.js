/* =========================================================
   CONFIG — preencha quando estiver definido
   ========================================================= */
const CONFIG = {
  // Link do checkout. Enquanto vazio, os botões rolam até a seção #oferta.
  checkoutUrl: "",
  // Data/hora de fechamento do carrinho (ISO, horário de Brasília). Ex.: "2026-11-30T23:59:59-03:00"
  // Enquanto null, o contador fica escondido.
  deadline: null,
  // Link de EMBED do vídeo da VSL (YouTube, Vimeo, Panda, etc.).
  // Ex.: "https://www.youtube.com/embed/ID_DO_VIDEO" ou "https://player-vz-xxxx.tv.pandavideo.com.br/embed/?v=ID"
  // Enquanto vazio, aparece a capa com o botão de play.
  vslUrl: "",
};

/* ---------- Checkout links ---------- */
if (CONFIG.checkoutUrl) {
  document.querySelectorAll(".js-checkout").forEach((a) => {
    // preserva UTMs da URL atual no checkout
    const url = new URL(CONFIG.checkoutUrl);
    new URLSearchParams(location.search).forEach((v, k) => url.searchParams.set(k, v));
    a.href = url.toString();
  });
}

/* ---------- Countdown ---------- */
(function countdown() {
  const el = document.getElementById("countdown");
  if (!el || !CONFIG.deadline) return;
  const end = new Date(CONFIG.deadline).getTime();
  if (Number.isNaN(end)) return;
  el.classList.add("on");
  const pad = (n) => String(n).padStart(2, "0");
  const q = (s) => el.querySelector(s);
  const tick = () => {
    const diff = Math.max(0, end - Date.now());
    q("[data-d]").textContent = pad(Math.floor(diff / 864e5));
    q("[data-h]").textContent = pad(Math.floor((diff / 36e5) % 24));
    q("[data-m]").textContent = pad(Math.floor((diff / 6e4) % 60));
    q("[data-s]").textContent = pad(Math.floor((diff / 1e3) % 60));
    if (diff > 0) setTimeout(tick, 1000);
  };
  tick();
})();

/* ---------- Reveal on scroll ---------- */
(function reveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e) => io.observe(e));
})();

/* ---------- Sticky mobile CTA (aparece depois do hero, some na oferta) ---------- */
(function sticky() {
  const bar = document.getElementById("sticky");
  const hero = document.querySelector(".hero");
  const offer = document.getElementById("oferta");
  if (!bar || !hero || !offer) return;
  let pastHero = false, inOffer = false;
  const update = () => bar.classList.toggle("show", pastHero && !inOffer);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; update(); }).observe(hero);
  new IntersectionObserver(([e]) => { inOffer = e.isIntersecting; update(); }, { threshold: 0.15 }).observe(offer);
})();

/* ---------- Método: anéis interligados + cards em linha ---------- */
(function venn() {
  const grid = document.querySelector(".method-grid");
  const venn = document.getElementById("venn");
  if (!grid || !venn) return;
  const cards = [...grid.querySelectorAll("[data-pillar]")];
  const rings = [...venn.querySelectorAll("[data-ring]")];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CYCLE = 3600;
  let i = 0, timer = null, paused = false, visible = false;

  const set = (n) => {
    i = n;
    venn.dataset.active = n;
    cards.forEach((c, j) => c.classList.toggle("is-active", j === n));
  };
  const pulse = () => { venn.classList.remove("pulse"); void venn.getBoundingClientRect(); venn.classList.add("pulse"); };
  const schedule = () => {
    clearTimeout(timer);
    if (paused || !visible || still) return;
    timer = setTimeout(() => { if (i === 2) pulse(); set((i + 1) % 3); schedule(); }, CYCLE);
  };
  const hold = (n) => { paused = true; grid.classList.add("paused"); set(n); clearTimeout(timer); };
  const release = () => { paused = false; grid.classList.remove("paused"); set(i); schedule(); };

  cards.forEach((c, n) => {
    c.addEventListener("mouseenter", () => hold(n));
    c.addEventListener("mouseleave", release);
    c.addEventListener("click", () => hold(n));
  });
  rings.forEach((r) => {
    const n = +r.dataset.ring;
    r.addEventListener("mouseenter", () => hold(n));
    r.addEventListener("mouseleave", release);
  });

  set(0);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { if (!paused) { set(i); schedule(); } } else clearTimeout(timer);
    }, { threshold: 0.3 }).observe(grid);
  } else { visible = true; schedule(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else schedule(); });
})();

/* ---------- VSL: troca a capa pelo player ao clicar ---------- */
(function vsl() {
  const box = document.getElementById("vsl");
  if (!box) return;
  const poster = box.querySelector(".vsl__poster");
  poster.addEventListener("click", () => {
    if (!CONFIG.vslUrl) { console.info("[VSL] Defina CONFIG.vslUrl em main.js para carregar o vídeo."); return; }
    const url = new URL(CONFIG.vslUrl, location.href);
    url.searchParams.set("autoplay", "1");
    const iframe = document.createElement("iframe");
    iframe.src = url.toString();
    iframe.title = "Vídeo do Gui Ávila";
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.allowFullscreen = true;
    poster.replaceWith(iframe);
  });
})();

/* ---------- Bônus: inclinação 3D + luz que segue o mouse ---------- */
(function tilt() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", x * 100 + "%");
      card.style.setProperty("--my", y * 100 + "%");
      card.style.transform = `rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; card.style.setProperty("--my", "0%"); });
  });
})();
