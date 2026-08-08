(() => {
  const brand = document.getElementById("brand-logo");
  if (brand) {
    brand.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }

  // Annotation-style line select
  document.querySelectorAll(".lyrics .line").forEach((line) => {
    line.addEventListener("click", () => {
      document.querySelectorAll(".lyrics .line.active").forEach((el) => {
        if (el !== line) el.classList.remove("active");
      });
      line.classList.toggle("active");
    });
  });

  // Q&A accordion
  document.querySelectorAll(".qa-item button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".qa-item");
      const open = item.classList.contains("open");
      document.querySelectorAll(".qa-item.open").forEach((el) => el.classList.remove("open"));
      if (!open) item.classList.add("open");
      const mark = btn.querySelector("span");
      document.querySelectorAll(".qa-item button span").forEach((s) => (s.textContent = "+"));
      if (!open && mark) mark.textContent = "−";
    });
  });

  // Local comments
  const box = document.getElementById("comment-box");
  const list = document.getElementById("comment-list");
  const empty = document.getElementById("comment-empty");
  const key = "rta-comments-v1";

  const render = () => {
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    if (!list) return;
    list.innerHTML = "";
    if (!items.length) {
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";
    items.forEach((c) => {
      const el = document.createElement("div");
      el.style.borderTop = "1px solid #ddd";
      el.style.padding = "0.85rem 0";
      el.innerHTML = `<strong>${c.name}</strong> · <span style="color:#666">${c.when}</span><p style="margin:.35rem 0 0">${c.text}</p>`;
      list.appendChild(el);
    });
  };

  if (box) {
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = box.value.trim();
        if (!text) return;
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        items.unshift({
          name: "Guest",
          when: "just now",
          text,
        });
        localStorage.setItem(key, JSON.stringify(items.slice(0, 40)));
        box.value = "";
        render();
      }
    });
  }
  render();

  // Viewer count bump
  const viewers = document.getElementById("viewer-count");
  if (viewers) {
    const n = Number(sessionStorage.getItem("rta-views") || "1") + 1;
    sessionStorage.setItem("rta-views", String(n));
    viewers.textContent = `👁 ${n} Viewer${n === 1 ? "" : "s"}`;
  }

  // Share buttons
  document.querySelectorAll("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = btn.getAttribute("data-share");
      const url = window.location.href;
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
          btn.textContent = type === "iq" ? "⚡ 1" : type === "x" ? "X" : "Facebook";
        }, 1200);
      } catch {
        /* ignore */
      }
    });
  });

  // Lightweight search filter on lyrics lines
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll(".lyrics .line").forEach((line) => {
        if (!q) {
          line.style.opacity = "1";
          return;
        }
        line.style.opacity = line.textContent.toLowerCase().includes(q) ? "1" : "0.25";
      });
    });
  }
})();
