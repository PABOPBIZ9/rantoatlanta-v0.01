(() => {
  const canvas = document.getElementById("cc-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  const els = {
    file: document.getElementById("cc-file"),
    user: document.getElementById("cc-user"),
    footer: document.getElementById("cc-footer"),
    brand: document.getElementById("cc-brand"),
    badge: document.getElementById("cc-badge"),
    roster: document.getElementById("cc-roster"),
    download: document.getElementById("cc-download"),
    copy: document.getElementById("cc-copy"),
  };

  const themes = {
    cash: { top: "#1a3d2a", mid: "#0b1812", bottom: "#030605", glow: "rgba(80, 180, 110, 0.18)" },
    flame: { top: "#4a2208", mid: "#1a0d06", bottom: "#050302", glow: "rgba(255, 138, 31, 0.22)" },
    ink: { top: "#1a222c", mid: "#0b1016", bottom: "#030507", glow: "rgba(120, 160, 220, 0.14)" },
  };

  const state = {
    width: 1080,
    height: 1080,
    theme: "cash",
    avatar: null,
    avatarUrl: null,
  };

  function ensureAt(name) {
    const raw = (name || "").trim();
    if (!raw) return "@supporter";
    return raw.startsWith("@") ? raw : `@${raw}`;
  }

  function roundRectPath(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawNoise() {
    const n = document.createElement("canvas");
    n.width = 128;
    n.height = 128;
    const nctx = n.getContext("2d");
    const img = nctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 90 + Math.random() * 40;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 18;
    }
    nctx.putImageData(img, 0, 0);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ctx.createPattern(n, "repeat");
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.globalAlpha = 1;
  }

  function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "#9dffb8";
    ctx.lineWidth = 1;
    for (let x = 0; x < state.width; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (x % 14 === 0 ? 18 : -12), state.height * 0.28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlamePill(x, y, size) {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, "#ffc53d");
    g.addColorStop(1, "#ff6a00");
    ctx.beginPath();
    ctx.roundRect(x, y, size * 1.7, size, size / 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.font = `800 ${Math.round(size * 0.55)}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RTA", x + size * 0.85, y + size * 0.52);
  }

  function coverImage(img, x, y, w, h) {
    const ir = img.width / img.height;
    const tr = w / h;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (ir > tr) {
      sw = img.height * tr;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / tr;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function draw() {
    const W = state.width;
    const H = state.height;
    canvas.width = W;
    canvas.height = H;

    const theme = themes[state.theme] || themes.cash;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, theme.top);
    bg.addColorStop(0.45, theme.mid);
    bg.addColorStop(1, theme.bottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.18, 20, W * 0.5, H * 0.18, W * 0.55);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    drawScanlines();
    drawNoise();

    const framePad = W * 0.14;
    const frameSize = W - framePad * 2;
    const frameY = H * (H > W ? 0.08 : 0.1);
    const radius = frameSize * 0.16;
    const stroke = Math.max(14, frameSize * 0.035);

    // Outer gold glow
    ctx.save();
    ctx.shadowColor = "rgba(255, 197, 61, 0.55)";
    ctx.shadowBlur = 36;
    roundRectPath(framePad, frameY, frameSize, frameSize, radius);
    const gold = ctx.createLinearGradient(framePad, frameY, framePad + frameSize, frameY + frameSize);
    gold.addColorStop(0, "#fff4c2");
    gold.addColorStop(0.35, "#ffc53d");
    gold.addColorStop(0.7, "#ff8a1f");
    gold.addColorStop(1, "#c45a00");
    ctx.fillStyle = gold;
    ctx.fill();
    ctx.restore();

    // Inner black well + avatar
    const inset = stroke;
    roundRectPath(framePad + inset, frameY + inset, frameSize - inset * 2, frameSize - inset * 2, radius * 0.82);
    ctx.fillStyle = "#050505";
    ctx.fill();
    ctx.save();
    roundRectPath(framePad + inset, frameY + inset, frameSize - inset * 2, frameSize - inset * 2, radius * 0.82);
    ctx.clip();
    if (state.avatar) {
      coverImage(
        state.avatar,
        framePad + inset,
        frameY + inset,
        frameSize - inset * 2,
        frameSize - inset * 2
      );
    } else {
      ctx.fillStyle = "#121212";
      ctx.fillRect(framePad + inset, frameY + inset, frameSize - inset * 2, frameSize - inset * 2);
      ctx.fillStyle = "rgba(255,197,61,0.55)";
      ctx.font = `700 ${Math.round(W * 0.045)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Drop NFT / avatar", W / 2, frameY + frameSize / 2);
    }
    ctx.restore();

    const user = ensureAt(els.user?.value);
    const userY = frameY + frameSize + (H > W ? H * 0.08 : H * 0.095);
    const userSize = Math.min(W * 0.13, 150 - Math.max(0, user.length - 12) * 4);
    const userGrad = ctx.createLinearGradient(0, userY - userSize, 0, userY + userSize * 0.35);
    userGrad.addColorStop(0, "#fff8e0");
    userGrad.addColorStop(0.45, "#ffc53d");
    userGrad.addColorStop(1, "#ff8a1f");
    ctx.fillStyle = userGrad;
    ctx.font = `900 ${Math.round(userSize)}px "Archivo Black", Impact, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(user, W / 2, userY);

    const badge = (els.badge?.value || "").trim();
    let footerY = userY + userSize * 0.85;
    if (badge) {
      ctx.fillStyle = "rgba(255,244,210,0.72)";
      ctx.font = `700 ${Math.round(W * 0.028)}px "IBM Plex Sans", sans-serif`;
      ctx.fillText(badge.toUpperCase(), W / 2, footerY);
      footerY += W * 0.045;
    } else {
      footerY += W * 0.02;
    }

    const footerLabel = (els.footer?.value || "Now on").trim();
    const brand = (els.brand?.value || "RanToAtlanta").trim();
    const pill = Math.round(W * 0.042);
    ctx.font = `600 ${Math.round(W * 0.038)}px "IBM Plex Sans", sans-serif`;
    const labelW = ctx.measureText(footerLabel).width;
    ctx.font = `700 ${Math.round(W * 0.038)}px "IBM Plex Sans", sans-serif`;
    const brandW = ctx.measureText(brand).width;
    const gap = W * 0.018;
    const total = labelW + gap + pill * 1.7 + gap + brandW;
    let x = (W - total) / 2;

    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${Math.round(W * 0.038)}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(footerLabel, x, footerY);
    x += labelW + gap;
    drawFlamePill(x, footerY - pill / 2, pill);
    x += pill * 1.7 + gap;
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(W * 0.038)}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(brand, x, footerY);
  }

  function loadImage(fileOrUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      if (typeof fileOrUrl === "string") {
        img.crossOrigin = "anonymous";
        img.src = fileOrUrl;
      } else {
        const url = URL.createObjectURL(fileOrUrl);
        if (state.avatarUrl) URL.revokeObjectURL(state.avatarUrl);
        state.avatarUrl = url;
        img.src = url;
      }
    });
  }

  function toast(msg) {
    const el = document.getElementById("points-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1400);
  }

  async function download() {
    draw();
    const a = document.createElement("a");
    const handle = ensureAt(els.user?.value).replace(/^@/, "");
    a.download = `rta-community-${handle}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    window.RTAPoints?.earn("share");
    toast("PNG downloaded · +50");
  }

  async function copyImage() {
    draw();
    try {
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("Copied to clipboard");
    } catch (_) {
      toast("Copy failed — use Download");
    }
  }

  els.download?.addEventListener("click", download);
  els.copy?.addEventListener("click", copyImage);

  document.querySelectorAll("[data-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");
      const h = +btn.dataset.size;
      state.width = 1080;
      state.height = h;
      draw();
    });
  });

  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");
      state.theme = btn.dataset.theme;
      draw();
    });
  });

  ["user", "footer", "brand", "badge"].forEach((key) => {
    els[key]?.addEventListener("input", draw);
  });

  els.file?.addEventListener("change", async () => {
    const file = els.file.files?.[0];
    if (!file) return;
    state.avatar = await loadImage(file);
    draw();
    window.RTAPoints?.earn("click");
  });

  window.addEventListener("paste", async (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    state.avatar = await loadImage(file);
    draw();
    toast("Image pasted");
  });

  document.getElementById("brand-logo")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.RTAPoints?.earn("brand");
    location.href = "./";
  });

  async function loadRoster() {
    try {
      const res = await fetch("community/roster.json");
      if (!res.ok) return;
      const data = await res.json();
      const people = data.supporters || [];
      if (!els.roster) return;
      els.roster.innerHTML = people
        .map(
          (p) =>
            `<button type="button" data-user="${String(p.handle || p).replace(/"/g, "")}">${
              String(p.handle || p).startsWith("@") ? p.handle || p : `@${p.handle || p}`
            }</button>`
        )
        .join("");
      els.roster.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-user]");
        if (!btn || !els.user) return;
        els.user.value = btn.dataset.user.startsWith("@") ? btn.dataset.user : `@${btn.dataset.user}`;
        if (els.badge && !els.badge.value) els.badge.value = "Early Supporter";
        draw();
      });
    } catch (_) {}
  }

  draw();
  loadRoster();
})();
