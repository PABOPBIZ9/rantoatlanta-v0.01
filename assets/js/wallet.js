/**
 * Cash App / tip / farm / refer / go-live economy (local FOMO wallet)
 */
(function (global) {
  const KEY = "rta-wallet-v1";
  const P = () => global.RTAPoints;

  function load() {
    try {
      return (
        JSON.parse(localStorage.getItem(KEY) || "null") || {
          cash: 25,
          farmed: 0,
          tipped: 0,
          spent: 0,
          referrals: 0,
          subscribed: false,
          live: false,
          referCode: "RTA" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        }
      );
    } catch {
      return { cash: 25, farmed: 0, tipped: 0, spent: 0, referrals: 0, subscribed: false, live: false, referCode: "RTA0000" };
    }
  }

  function save(w) {
    localStorage.setItem(KEY, JSON.stringify(w));
    global.dispatchEvent(new CustomEvent("rta:wallet", { detail: w }));
  }

  function render(w = load()) {
    const cashTxt = `$${w.cash.toFixed(2)}`;
    ["wallet-cash", "wallet-cash-hud"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = cashTxt;
    });
    const farmed = document.getElementById("wallet-farmed");
    const tipped = document.getElementById("wallet-tipped");
    const refs = document.getElementById("wallet-refs");
    const code = document.getElementById("refer-code");
    const sub = document.getElementById("sub-status");
    const live = document.getElementById("live-status");
    if (farmed) farmed.textContent = String(w.farmed);
    if (tipped) tipped.textContent = `$${w.tipped.toFixed(2)}`;
    if (refs) refs.textContent = String(w.referrals);
    if (code) code.textContent = w.referCode;
    if (sub) sub.textContent = w.subscribed ? "SUBSCRIBED ✓" : "Not subscribed";
    if (live) live.textContent = w.live ? "YOU ARE LIVE 🔴" : "Offline";
  }

  function tip(amount = 1) {
    const w = load();
    if (w.cash < amount) {
      alert("Not enough wallet cash — farm or get tipped first.");
      return w;
    }
    w.cash -= amount;
    w.tipped += amount;
    w.spent += amount;
    save(w);
    P()?.earn("tip");
    P()?.earn("spend");
    render(w);
    return w;
  }

  function farm() {
    const w = load();
    const gain = 0.25 + Math.random() * 1.25;
    w.cash += gain;
    w.farmed += 1;
    save(w);
    P()?.earn("farm");
    render(w);
    return { w, gain };
  }

  function subscribe() {
    const w = load();
    if (!w.subscribed) {
      if (w.cash < 4.99) {
        alert("Need $4.99 in wallet — farm a bit first.");
        return w;
      }
      w.cash -= 4.99;
      w.spent += 4.99;
      w.subscribed = true;
      save(w);
      P()?.earn("subscribe");
      P()?.earn("spend");
    }
    render(w);
    return w;
  }

  function goLive() {
    const w = load();
    w.live = !w.live;
    save(w);
    if (w.live) P()?.earn("live");
    render(w);
    return w;
  }

  function refer() {
    const w = load();
    w.referrals += 1;
    w.cash += 3;
    save(w);
    P()?.earn("refer");
    const link = `${location.origin}${location.pathname}?ref=${w.referCode}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    render(w);
    return { w, link };
  }

  function init() {
    render();
    // Passive farm tick while on page (Douyin/pump energy)
    setInterval(() => {
      const w = load();
      if (!w.live) return;
      w.cash += 0.05;
      w.farmed += 1;
      save(w);
      P()?.earn("farm");
      render(w);
    }, 8000);

    document.getElementById("btn-tip")?.addEventListener("click", () => tip(1));
    document.getElementById("btn-tip-5")?.addEventListener("click", () => tip(5));
    document.getElementById("btn-farm")?.addEventListener("click", () => {
      const { gain } = farm();
      const toast = document.getElementById("points-toast");
      if (toast) {
        toast.textContent = `+$${gain.toFixed(2)} farmed`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1200);
      }
    });
    document.getElementById("btn-subscribe")?.addEventListener("click", subscribe);
    document.getElementById("btn-live")?.addEventListener("click", goLive);
    document.getElementById("btn-refer")?.addEventListener("click", () => {
      const { link } = refer();
      alert(`Invite copied:\n${link}`);
    });
  }

  global.RTAWallet = { load, tip, farm, subscribe, goLive, refer, render };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
