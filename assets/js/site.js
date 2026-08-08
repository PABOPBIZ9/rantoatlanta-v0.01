(() => {
  const P = window.RTAPoints;
  if (!P) return;

  const ANN_KEY = "rta-annotations-v1";
  const COMM_KEY = "rta-comments-v2";
  const DM_KEY = "rta-dms-v1";

  // —— Brand logo refresh ——
  const brand = document.getElementById("brand-logo");
  if (brand) {
    brand.addEventListener("click", (e) => {
      e.preventDefault();
      P.earn("brand");
      window.location.reload();
    });
  }

  // —— HUD / FOMO ticker ——
  const hudPoints = document.getElementById("hud-points");
  const hudRank = document.getElementById("hud-rank");
  const hudPulse = document.getElementById("hud-pulse");
  const boardEl = document.getElementById("leaderboard");
  const feedEl = document.getElementById("live-feed");
  const toastEl = document.getElementById("points-toast");

  function toast(amount, action) {
    if (!toastEl || amount <= 0) return;
    toastEl.textContent = `+${amount} · ${action}`;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 1400);
  }

  function renderHud(detail) {
    const state = detail?.state || P.load();
    const board = detail?.board || P.getBoard();
    if (hudPoints) {
      hudPoints.textContent = P.format(state.points);
      hudPoints.classList.add("bump");
      setTimeout(() => hudPoints.classList.remove("bump"), 250);
    }
    if (hudRank) {
      const rank = board.findIndex((b) => b.you) + 1;
      hudRank.textContent = rank > 0 ? `#${rank}` : "—";
    }
    if (hudPulse && detail?.passive) {
      hudPulse.textContent = `+${detail.passive} live`;
    }
    if (boardEl) {
      boardEl.innerHTML = board
        .slice(0, 8)
        .map(
          (b, i) =>
            `<li class="${b.you ? "you" : ""}"><span class="r">${i + 1}</span><span class="n">${escapeHtml(
              b.name
            )}</span><span class="p">${P.format(b.points)}</span></li>`
        )
        .join("");
    }
    if (feedEl) {
      const feed = P.getFeed().slice(0, 12);
      const labels = {
        click: "clicked",
        watch: "watched",
        share: "shared",
        comment: "commented",
        annotate: "annotated",
        upvote: "upvoted",
        downvote: "downvoted",
        join: "joined",
        repost: "reposted",
        dm: "sent a DM",
        reply: "replied",
        scroll: "scrolled",
        search: "searched",
        play: "hit play",
        brand: "refreshed brand",
      };
      feedEl.innerHTML = feed.length
        ? feed
            .map(
              (f) =>
                `<li><strong>${escapeHtml(f.who)}</strong> ${labels[f.action] || f.action} <em>+${
                  f.amount
                }</em></li>`
            )
            .join("")
        : "<li>Be first — click a line, drop knowledge, stack points.</li>";
    }
  }

  window.addEventListener("rta:points", (e) => {
    toast(e.detail.amount, e.detail.action);
    renderHud(e.detail);
  });
  window.addEventListener("rta:tick", (e) => renderHud(e.detail));

  // Kick FOMO loop — points climb at all times
  P.tick();
  renderHud({});
  setInterval(() => P.tick(), 2200);

  // Passive click economy on interactive UI
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest("a, button, .line, .vote, .hud, .qa-item");
      if (!t) return;
      if (t.closest("#annotate-panel") || t.closest("#dm-panel")) return;
      if (t.classList.contains("line")) return; // handled separately
      if (t.dataset.share || t.dataset.action) return;
      P.earn("click");
    },
    true
  );

  // Scroll reward (throttled)
  let lastScrollEarn = 0;
  window.addEventListener(
    "scroll",
    () => {
      const now = Date.now();
      if (now - lastScrollEarn < 4000) return;
      lastScrollEarn = now;
      P.earn("scroll");
    },
    { passive: true }
  );

  // —— Genius annotations ——
  const panel = document.getElementById("annotate-panel");
  const panelLine = document.getElementById("annotate-line");
  const panelBody = document.getElementById("annotate-body");
  const panelList = document.getElementById("annotate-list");
  const panelClose = document.getElementById("annotate-close");
  const panelSave = document.getElementById("annotate-save");
  let activeLineId = null;

  function lineId(el) {
    if (!el.dataset.lineId) {
      const all = [...document.querySelectorAll(".lyrics .line")];
      el.dataset.lineId = "L" + all.indexOf(el);
    }
    return el.dataset.lineId;
  }

  function loadAnns() {
    return JSON.parse(localStorage.getItem(ANN_KEY) || "{}");
  }

  function saveAnns(data) {
    localStorage.setItem(ANN_KEY, JSON.stringify(data));
  }

  function markAnnotatedLines() {
    const data = loadAnns();
    document.querySelectorAll(".lyrics .line").forEach((line) => {
      const id = lineId(line);
      const count = (data[id] || []).length;
      line.classList.toggle("has-note", count > 0);
      let badge = line.querySelector(".ann-count");
      if (count > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "ann-count";
          line.appendChild(badge);
        }
        badge.textContent = String(count);
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function openAnnotate(line) {
    activeLineId = lineId(line);
    document.querySelectorAll(".lyrics .line.active").forEach((el) => el.classList.remove("active"));
    line.classList.add("active");
    if (panelLine) panelLine.textContent = line.childNodes[0]?.textContent?.trim() || line.textContent;
    if (panelBody) panelBody.value = "";
    renderAnnList();
    panel?.classList.add("open");
    P.earn("click");
  }

  function renderAnnList() {
    if (!panelList || !activeLineId) return;
    const notes = loadAnns()[activeLineId] || [];
    panelList.innerHTML = notes.length
      ? notes
          .map(
            (n) =>
              `<article class="ann-card"><header><strong>${escapeHtml(
                n.who
              )}</strong><span>+${n.pts} IQ</span></header><p>${escapeHtml(n.text)}</p>
              <div class="vote-row">
                <button type="button" class="vote up" data-ann-up="${n.id}">▲ ${n.ups || 0}</button>
                <button type="button" class="vote down" data-ann-down="${n.id}">▼</button>
              </div></article>`
          )
          .join("")
      : `<p class="muted">No annotations yet — drop the first note (+${P.REWARDS.annotate} pts).</p>`;
  }

  document.querySelectorAll(".lyrics .line").forEach((line) => {
    lineId(line);
    line.addEventListener("click", () => openAnnotate(line));
  });
  markAnnotatedLines();

  panelClose?.addEventListener("click", () => panel?.classList.remove("open"));
  panelSave?.addEventListener("click", () => {
    const text = panelBody?.value.trim();
    if (!text || !activeLineId) return;
    const state = P.load();
    const data = loadAnns();
    const note = {
      id: "a_" + Date.now(),
      who: state.name,
      text,
      ups: 0,
      pts: P.REWARDS.annotate,
      t: Date.now(),
    };
    data[activeLineId] = [note, ...(data[activeLineId] || [])];
    saveAnns(data);
    P.earn("annotate", { line: activeLineId });
    panelBody.value = "";
    renderAnnList();
    markAnnotatedLines();
  });

  panelList?.addEventListener("click", (e) => {
    const up = e.target.closest("[data-ann-up]");
    const down = e.target.closest("[data-ann-down]");
    if (!up && !down) return;
    const data = loadAnns();
    const notes = data[activeLineId] || [];
    const id = up?.dataset.annUp || down?.dataset.annDown;
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (up) {
      note.ups = (note.ups || 0) + 1;
      P.earn("upvote");
    } else {
      note.ups = Math.max(0, (note.ups || 0) - 1);
      P.earn("downvote");
    }
    saveAnns(data);
    renderAnnList();
  });

  // —— Comments (Reddit-style) ——
  const box = document.getElementById("comment-box");
  const list = document.getElementById("comment-list");
  const empty = document.getElementById("comment-empty");
  const postBtn = document.getElementById("comment-post");

  function loadComments() {
    return JSON.parse(localStorage.getItem(COMM_KEY) || "[]");
  }
  function saveComments(items) {
    localStorage.setItem(COMM_KEY, JSON.stringify(items.slice(0, 80)));
  }

  function renderComments() {
    if (!list) return;
    const items = loadComments();
    list.innerHTML = "";
    if (!items.length) {
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";
    items.forEach((c) => {
      const el = document.createElement("article");
      el.className = "comment-card";
      el.innerHTML = `
        <div class="vote-col">
          <button type="button" class="vote up" data-up="${c.id}" aria-label="Upvote">▲</button>
          <span class="score">${c.score || 0}</span>
          <button type="button" class="vote down" data-down="${c.id}" aria-label="Downvote">▼</button>
        </div>
        <div class="comment-body">
          <header><strong>${escapeHtml(c.name)}</strong> · <span>${escapeHtml(c.when)}</span>
          <button type="button" class="linkish" data-dm="${escapeHtml(c.name)}">DM</button>
          <button type="button" class="linkish" data-repost="${c.id}">Repost</button>
          </header>
          <p>${escapeHtml(c.text)}</p>
          <button type="button" class="linkish" data-reply="${c.id}">Reply</button>
          <div class="replies">${(c.replies || [])
            .map(
              (r) =>
                `<div class="reply"><strong>${escapeHtml(r.name)}</strong> ${escapeHtml(r.text)}</div>`
            )
            .join("")}</div>
        </div>`;
      list.appendChild(el);
    });
  }

  function postComment() {
    const text = box?.value.trim();
    if (!text) return;
    const state = P.load();
    const items = loadComments();
    items.unshift({
      id: "c_" + Date.now(),
      name: state.name,
      when: "just now",
      text,
      score: 1,
      replies: [],
    });
    saveComments(items);
    box.value = "";
    P.earn("comment");
    renderComments();
  }

  postBtn?.addEventListener("click", postComment);
  box?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      postComment();
    }
  });

  list?.addEventListener("click", (e) => {
    const up = e.target.closest("[data-up]");
    const down = e.target.closest("[data-down]");
    const reply = e.target.closest("[data-reply]");
    const repost = e.target.closest("[data-repost]");
    const dm = e.target.closest("[data-dm]");
    const items = loadComments();

    if (up || down) {
      const id = up?.dataset.up || down?.dataset.down;
      const c = items.find((x) => x.id === id);
      if (!c) return;
      c.score = (c.score || 0) + (up ? 1 : -1);
      saveComments(items);
      P.earn(up ? "upvote" : "downvote");
      renderComments();
      return;
    }
    if (reply) {
      const text = prompt("Reply:");
      if (!text?.trim()) return;
      const c = items.find((x) => x.id === reply.dataset.reply);
      if (!c) return;
      c.replies = c.replies || [];
      c.replies.push({ name: P.load().name, text: text.trim() });
      saveComments(items);
      P.earn("reply");
      renderComments();
      return;
    }
    if (repost) {
      P.earn("repost");
      toast(P.REWARDS.repost, "repost");
      return;
    }
    if (dm) {
      openDm(dm.dataset.dm);
    }
  });
  renderComments();

  // —— DMs ——
  const dmPanel = document.getElementById("dm-panel");
  const dmTo = document.getElementById("dm-to");
  const dmBody = document.getElementById("dm-body");
  const dmThread = document.getElementById("dm-thread");
  const dmSend = document.getElementById("dm-send");
  const dmClose = document.getElementById("dm-close");
  const dmOpen = document.getElementById("open-dms");
  let dmTarget = "BounceQueenATL";

  function loadDms() {
    return JSON.parse(localStorage.getItem(DM_KEY) || "{}");
  }
  function saveDms(data) {
    localStorage.setItem(DM_KEY, JSON.stringify(data));
  }

  function openDm(to) {
    dmTarget = to || dmTarget;
    if (dmTo) dmTo.textContent = dmTarget;
    renderDmThread();
    dmPanel?.classList.add("open");
  }

  function renderDmThread() {
    if (!dmThread) return;
    const data = loadDms();
    const thread = data[dmTarget] || [
      {
        who: dmTarget,
        text: "yo you heard that Mannie Fresh chorus? stack IQ and climb the board 🔥",
        me: false,
      },
    ];
    dmThread.innerHTML = thread
      .map(
        (m) =>
          `<div class="dm-bubble ${m.me ? "me" : ""}"><strong>${escapeHtml(
            m.who
          )}</strong><p>${escapeHtml(m.text)}</p></div>`
      )
      .join("");
    dmThread.scrollTop = dmThread.scrollHeight;
  }

  dmOpen?.addEventListener("click", () => openDm(dmTarget));
  dmClose?.addEventListener("click", () => dmPanel?.classList.remove("open"));
  dmSend?.addEventListener("click", () => {
    const text = dmBody?.value.trim();
    if (!text) return;
    const data = loadDms();
    const state = P.load();
    data[dmTarget] = data[dmTarget] || [];
    data[dmTarget].push({ who: state.name, text, me: true });
    // faux reply FOMO
    data[dmTarget].push({
      who: dmTarget,
      text: "bet. +pts stacking — don't sleep on the board",
      me: false,
    });
    saveDms(data);
    dmBody.value = "";
    P.earn("dm");
    renderDmThread();
  });

  // —— Join / profile ——
  const joinBtn = document.getElementById("join-btn");
  const nameInput = document.getElementById("display-name");
  joinBtn?.addEventListener("click", () => {
    if (nameInput?.value.trim()) P.setName(nameInput.value.trim());
    const { amount } = P.join();
    if (amount) toast(amount, "join");
    else toast(0, "already in");
    renderHud({});
    document.getElementById("join-status").textContent = `You're in as ${P.load().name}`;
  });

  // seed name field
  if (nameInput) nameInput.placeholder = P.load().name;

  // —— Share ——
  document.querySelectorAll("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = btn.getAttribute("data-share");
      const url = window.location.href;
      P.earn("share");
      if (type === "embed") {
        const snip = `<iframe src="${url}" width="100%" height="600" style="border:0"></iframe>`;
        try {
          await navigator.clipboard.writeText(snip);
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Embed"), 1200);
        } catch {
          alert(snip);
        }
        return;
      }
      if (navigator.share) {
        navigator.share({ title: document.title, url }).catch(() => {});
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = "Link copied";
        setTimeout(() => {
          btn.textContent = type === "iq" ? "⚡ IQ" : type === "x" ? "X" : "Facebook";
        }, 1200);
      } catch {
        /* ignore */
      }
    });
  });

  // —— Video watch / play ——
  document.querySelectorAll('[href="#video"], .media-main .play').forEach((el) => {
    el.addEventListener("click", () => P.earn("play"));
  });
  const videoSection = document.getElementById("video");
  if (videoSection && "IntersectionObserver" in window) {
    let watched = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !watched) {
            watched = true;
            P.earn("watch");
          }
        });
      },
      { threshold: 0.45 }
    );
    io.observe(videoSection);
  }

  // —— Q&A ——
  document.querySelectorAll(".qa-item button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".qa-item");
      const open = item.classList.contains("open");
      document.querySelectorAll(".qa-item.open").forEach((el) => el.classList.remove("open"));
      if (!open) item.classList.add("open");
      const mark = btn.querySelector("span:last-child");
      document.querySelectorAll(".qa-item button span:last-child").forEach((s) => (s.textContent = "+"));
      if (!open && mark) mark.textContent = "−";
      P.earn("click");
    });
  });

  // —— Search ——
  const search = document.getElementById("search");
  let searched = false;
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll(".lyrics .line").forEach((line) => {
        if (!q) {
          line.style.opacity = "1";
          return;
        }
        const text = line.childNodes[0]?.textContent || line.textContent;
        line.style.opacity = text.toLowerCase().includes(q) ? "1" : "0.25";
      });
      if (q && !searched) {
        searched = true;
        P.earn("search");
      }
    });
  }

  // Viewer count
  const viewers = document.getElementById("viewer-count");
  if (viewers) {
    const n = Number(sessionStorage.getItem("rta-views") || "1") + 1;
    sessionStorage.setItem("rta-views", String(n));
    viewers.textContent = `👁 ${n} Viewer${n === 1 ? "" : "s"}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
