/**
 * Follows + notifications (Genius / IG / TikTok vibes)
 */
(function (global) {
  const FOLLOWS = "rta-follows-v1";
  const NOTES = "rta-notes-v1";
  const P = () => global.RTAPoints;

  const CREATORS = [
    { id: "magnolia-mike", name: "MagnoliaMike", role: "Annotator" },
    { id: "bounce-queen", name: "BounceQueenATL", role: "Host" },
    { id: "wayne-bars", name: "WayneBars97", role: "Scholar" },
    { id: "cash-money-kid", name: "CashMoneyKid", role: "Tipper" },
    { id: "hot-boy-scholar", name: "HotBoyScholar", role: "Contributor" },
  ];

  function loadFollows() {
    try {
      return JSON.parse(localStorage.getItem(FOLLOWS) || "[]");
    } catch {
      return [];
    }
  }

  function saveFollows(list) {
    localStorage.setItem(FOLLOWS, JSON.stringify(list));
  }

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES) || "[]");
    } catch {
      return [];
    }
  }

  function pushNote(text, kind = "info") {
    const items = loadNotes();
    items.unshift({ id: "n_" + Date.now(), text, kind, t: Date.now(), read: false });
    localStorage.setItem(NOTES, JSON.stringify(items.slice(0, 40)));
    renderBell();
  }

  function follow(id) {
    const list = loadFollows();
    if (list.includes(id)) return false;
    list.push(id);
    saveFollows(list);
    const c = CREATORS.find((x) => x.id === id);
    pushNote(`You followed ${c?.name || id}`, "follow");
    P()?.earn("follow");
    renderFollows();
    return true;
  }

  function unfollow(id) {
    saveFollows(loadFollows().filter((x) => x !== id));
    renderFollows();
  }

  function toggle(id) {
    return loadFollows().includes(id) ? (unfollow(id), false) : (follow(id), true);
  }

  function renderFollows() {
    const el = document.getElementById("follow-rail");
    if (!el) return;
    const followed = new Set(loadFollows());
    el.innerHTML = CREATORS.map(
      (c) => `
      <article class="follow-card">
        <div class="avatar">${c.name.slice(0, 1)}</div>
        <div>
          <strong>${c.name}</strong>
          <span>${c.role}</span>
        </div>
        <button type="button" data-follow="${c.id}" class="${followed.has(c.id) ? "on" : ""}">
          ${followed.has(c.id) ? "Following" : "Follow · +25"}
        </button>
      </article>`
    ).join("");
  }

  function renderBell() {
    const badge = document.getElementById("notif-count");
    const panel = document.getElementById("notif-list");
    const notes = loadNotes();
    const unread = notes.filter((n) => !n.read).length;
    if (badge) {
      badge.textContent = String(unread);
      badge.hidden = unread === 0;
    }
    if (panel) {
      panel.innerHTML = notes.length
        ? notes
            .map(
              (n) =>
                `<li class="${n.read ? "" : "unread"}"><strong>${n.kind}</strong> ${n.text}</li>`
            )
            .join("")
        : "<li>No notifications yet — follow, tip, or go live.</li>";
    }
  }

  function markRead() {
    const notes = loadNotes().map((n) => ({ ...n, read: true }));
    localStorage.setItem(NOTES, JSON.stringify(notes));
    renderBell();
  }

  function tipCelebrate(amount) {
    const layer = document.getElementById("celebrate");
    if (!layer) return;
    layer.innerHTML = "";
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 0.4 + "s";
      s.textContent = ["$", "★", "🔥", "●"][i % 4];
      layer.appendChild(s);
    }
    layer.classList.add("show");
    pushNote(`Tip sent · $${amount}`, "tip");
    setTimeout(() => layer.classList.remove("show"), 1600);
  }

  function init() {
    renderFollows();
    renderBell();
    document.getElementById("follow-rail")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-follow]");
      if (!btn) return;
      toggle(btn.dataset.follow);
    });
    document.getElementById("notif-btn")?.addEventListener("click", () => {
      document.getElementById("notif-panel")?.classList.toggle("open");
      markRead();
      P()?.earn("click");
    });

    // Ambient social FOMO notes
    const lines = [
      "BounceQueenATL just went live",
      "MagnoliaMike annotated a bar · +100",
      "CashMoneyKid tipped $5",
      "New market heat on Wayne verse",
    ];
    setInterval(() => {
      if (Math.random() > 0.55) return;
      pushNote(lines[Math.floor(Math.random() * lines.length)], "live");
    }, 14000);

    global.addEventListener("rta:points", (e) => {
      if (e.detail?.action === "tip") tipCelebrate(1);
      if (e.detail?.action === "live") pushNote("You're live — farming passive IQ", "live");
      if (e.detail?.action === "refer") pushNote("Invite copied — friend joins = more cash", "refer");
    });
  }

  global.RTASocial = { CREATORS, follow, unfollow, toggle, pushNote, tipCelebrate, loadFollows };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
