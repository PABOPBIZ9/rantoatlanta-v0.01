/**
 * On-site media: banners + player that prefers local embeds over leaving the site.
 */
(function (global) {
  const P = () => global.RTAPoints;

  async function loadManifest() {
    try {
      const res = await fetch("media/manifest.json?v=5", { cache: "no-store" });
      if (!res.ok) throw new Error("manifest missing");
      return await res.json();
    } catch {
      return { banners: [], tracks: [] };
    }
  }

  async function probe(url) {
    if (!url) return false;
    try {
      const head = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (head.ok) return true;
    } catch {
      /* fall through */
    }
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store", headers: { Range: "bytes=0-1" } });
      return res.ok || res.status === 206;
    } catch {
      return false;
    }
  }

  function renderBanners(banners) {
    const rail = document.getElementById("banner-rail");
    if (!rail || !banners?.length) return;
    rail.innerHTML = banners
      .map(
        (b, i) => `
      <a class="banner-slide ${i === 0 ? "active" : ""}" href="${b.href || "#studio"}" data-banner="${i}">
        <img src="${b.src}" alt="${b.alt || "promo"}" loading="${i ? "lazy" : "eager"}" />
      </a>`
      )
      .join("");

    let idx = 0;
    const slides = () => [...rail.querySelectorAll(".banner-slide")];
    setInterval(() => {
      const all = slides();
      if (all.length < 2) return;
      all[idx]?.classList.remove("active");
      idx = (idx + 1) % all.length;
      all[idx]?.classList.add("active");
    }, 6000);

    rail.addEventListener("click", () => P()?.earn("banner"));
  }

  function setStatus(msg) {
    const el = document.getElementById("studio-status");
    if (el) el.textContent = msg;
  }

  function showMini(track, playing) {
    const mini = document.getElementById("mini-player");
    const mt = document.getElementById("mini-title");
    const mc = document.getElementById("mini-cover");
    const mb = document.getElementById("mini-toggle");
    if (!mini) return;
    mini.hidden = false;
    document.body.classList.add("has-mini");
    if (mt) mt.textContent = `${track.title} · ${track.artist}`;
    if (mc) mc.src = track.cover || "assets/img/cover.jpg";
    if (mb) mb.textContent = playing ? "❚❚" : "▶";
  }

  let currentTrack = null;
  let activeEl = null;

  async function playTrack(track, mode = "auto") {
    currentTrack = track;
    const audio = document.getElementById("studio-audio");
    const video = document.getElementById("studio-video");
    const iframe = document.getElementById("studio-fallback");
    const title = document.getElementById("studio-title");
    const cover = document.getElementById("studio-cover");
    if (title) title.textContent = `${track.title} · ${track.artist}`;
    if (cover) cover.src = track.cover || "assets/img/cover.jpg";

    // Hide all first
    [audio, video, iframe].forEach((el) => {
      if (!el) return;
      el.hidden = true;
      if (el.pause) el.pause();
      if (el.tagName === "IFRAME") el.src = "";
    });
    activeEl = null;

    const hasVideo = mode !== "audio" && track.video && (await probe(track.video));
    const hasAudio = track.audio && (await probe(track.audio));
    const hasClip = mode === "clip" && track.clip && (await probe(track.clip));

    if (hasClip && video) {
      video.src = track.clip;
      video.hidden = false;
      video.play().catch(() => {});
      activeEl = video;
      setStatus("Playing on-site clip · users stay here");
      showMini(track, true);
      P()?.earn("play");
      return;
    }

    if (hasVideo && video) {
      video.src = track.video;
      video.hidden = false;
      video.play().catch(() => {});
      activeEl = video;
      setStatus("Playing on-site video embed");
      showMini(track, true);
      P()?.earn("watch");
      return;
    }

    if (hasAudio && audio) {
      audio.src = track.audio;
      audio.hidden = false;
      audio.play().catch(() => {});
      activeEl = audio;
      setStatus("Playing on-site audio · drop mp4 for full visual");
      showMini(track, true);
      P()?.earn("play");
      return;
    }

    // In-page fallback embed (still does not navigate away)
    if (track.fallbackEmbed && iframe) {
      iframe.src = track.fallbackEmbed;
      iframe.hidden = false;
      setStatus("In-page embed (fallback). Drop mp3/mp4 into media/embeds/ to go fully native.");
      showMini(track, true);
      P()?.earn("watch");
      return;
    }

    setStatus(`Drop files → ${track.audio || track.video} then hit Play`);
    showMini(track, false);
  }

  function toggleMini() {
    if (!activeEl) {
      if (currentTrack) playTrack(currentTrack);
      return;
    }
    if (activeEl.paused) {
      activeEl.play().catch(() => {});
      showMini(currentTrack, true);
    } else {
      activeEl.pause();
      showMini(currentTrack, false);
    }
  }

  function wireStudio(manifest) {
    const list = document.getElementById("studio-tracklist");
    if (!list) return;
    list.innerHTML = (manifest.tracks || [])
      .map(
        (t, i) => `
      <button type="button" class="studio-track ${i === 0 ? "active" : ""}" data-id="${t.id}">
        <img src="${t.cover}" alt="" />
        <span>
          <strong>${t.title}</strong>
          <em>${t.album}</em>
        </span>
      </button>`
      )
      .join("");

    const byId = Object.fromEntries((manifest.tracks || []).map((t) => [t.id, t]));
    let current = manifest.tracks?.[0];

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      list.querySelectorAll(".studio-track").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      current = byId[btn.dataset.id];
      P()?.earn("track");
      playTrack(current);
    });

    current = manifest.tracks?.[0];
    currentTrack = current;

    document.getElementById("studio-play")?.addEventListener("click", () => {
      if (current) playTrack(current);
    });
    document.getElementById("studio-audio-only")?.addEventListener("click", () => {
      if (current) playTrack(current, "audio");
    });
    document.getElementById("mini-toggle")?.addEventListener("click", toggleMini);
    document.getElementById("mini-open")?.addEventListener("click", () => {
      document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
    });

    if (current) {
      setStatus("Ready · Demo tone plays on-site. Drop real masters anytime.");
      showMini(current, false);
    }
  }

  async function init() {
    const manifest = await loadManifest();
    renderBanners(manifest.banners);
    wireStudio(manifest);
    global.RTAMedia = { manifest, playTrack, loadManifest, toggleMini };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
