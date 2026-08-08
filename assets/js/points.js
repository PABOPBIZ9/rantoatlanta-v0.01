/**
 * RanToAtlanta FOMO points engine
 * Points climb from every interaction + passive live tick.
 */
(function (global) {
  const STORE = "rta-points-v3";
  const BOARD = "rta-board-v3";
  const FEED = "rta-feed-v3";

  const REWARDS = {
    click: 1,
    watch: 25,
    share: 50,
    comment: 40,
    annotate: 100,
    upvote: 5,
    downvote: 1,
    join: 200,
    repost: 75,
    dm: 30,
    reply: 20,
    scroll: 2,
    search: 3,
    play: 15,
    brand: 10,
    streak: 88,
    quote: 35,
    track: 12,
  };

  const LEVELS = [
    { min: 0, title: "New Bounce", badge: "NB" },
    { min: 200, title: "Block Runner", badge: "BR" },
    { min: 500, title: "Porch Scholar", badge: "PS" },
    { min: 1000, title: "Hot Boy", badge: "HB" },
    { min: 2500, title: "Big Tymer", badge: "BT" },
    { min: 5000, title: "Magnolia General", badge: "MG" },
    { min: 10000, title: "Cash Money Legend", badge: "CM" },
  ];

  const BOTS = [
    { name: "MagnoliaMike", base: 8420 },
    { name: "CashMoneyKid", base: 7910 },
    { name: "BounceQueenATL", base: 7340 },
    { name: "WayneBars97", base: 6880 },
    { name: "SetItOffStan", base: 6120 },
    { name: "HotBoyScholar", base: 5590 },
    { name: "TurkTape", base: 4980 },
    { name: "JuveCorner", base: 4510 },
  ];

  function dayKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE) || localStorage.getItem("rta-points-v2");
      return JSON.parse(raw || "null") || defaultState();
    } catch {
      return defaultState();
    }
  }

  function defaultState() {
    const id = "rta_" + Math.random().toString(36).slice(2, 8);
    return {
      id,
      name: "HotBoy#" + Math.floor(1000 + Math.random() * 9000),
      points: 88,
      joined: false,
      actions: {},
      streak: 0,
      lastCheckIn: "",
      lastTick: Date.now(),
      createdAt: Date.now(),
    };
  }

  function save(state) {
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function levelFor(points) {
    let cur = LEVELS[0];
    for (const lv of LEVELS) {
      if (points >= lv.min) cur = lv;
    }
    const next = LEVELS.find((l) => l.min > cur.min) || null;
    return { ...cur, next, progress: next ? (points - cur.min) / (next.min - cur.min) : 1 };
  }

  function pushFeed(entry) {
    const items = JSON.parse(localStorage.getItem(FEED) || "[]");
    items.unshift({ ...entry, t: Date.now() });
    localStorage.setItem(FEED, JSON.stringify(items.slice(0, 80)));
  }

  function earn(action, meta = {}) {
    const state = load();
    const amount = REWARDS[action] ?? 1;
    state.points += amount;
    state.actions[action] = (state.actions[action] || 0) + 1;
    state.lastTick = Date.now();
    save(state);
    pushFeed({
      who: state.name,
      action,
      amount,
      meta,
    });
    global.dispatchEvent(
      new CustomEvent("rta:points", {
        detail: { state, action, amount, meta, level: levelFor(state.points) },
      })
    );
    return { state, amount };
  }

  function checkIn() {
    const state = load();
    const today = dayKey();
    if (state.lastCheckIn === today) {
      return { state, amount: 0, streak: state.streak || 0, already: true };
    }
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    state.streak = state.lastCheckIn === yesterday ? (state.streak || 0) + 1 : 1;
    state.lastCheckIn = today;
    save(state);
    const bonus = REWARDS.streak + Math.min(120, (state.streak - 1) * 12);
    state.points += bonus;
    state.actions.streak = (state.actions.streak || 0) + 1;
    save(state);
    pushFeed({ who: state.name, action: "streak", amount: bonus, meta: { streak: state.streak } });
    global.dispatchEvent(
      new CustomEvent("rta:points", {
        detail: {
          state,
          action: "streak",
          amount: bonus,
          meta: { streak: state.streak },
          level: levelFor(state.points),
        },
      })
    );
    return { state, amount: bonus, streak: state.streak, already: false };
  }

  function onlineNow() {
    const now = Date.now();
    // Fake-but-fun online pulse between ~180–420
    return 180 + Math.floor((Math.sin(now / 7000) + 1) * 90) + Math.floor((now / 5000) % 40);
  }

  /** Passive FOMO: your score + community board always climb */
  function tick() {
    const state = load();
    const now = Date.now();
    const elapsed = Math.max(0, now - (state.lastTick || now));
    const passive = Math.min(12, Math.floor(elapsed / 2200) + 1);
    state.points += passive;
    state.lastTick = now;
    save(state);

    const launch = Date.UTC(2026, 7, 8, 14, 0, 0);
    const mins = Math.max(0, Math.floor((now - launch) / 60000));
    const board = BOTS.map((b, i) => {
      const pulse = Math.floor((now / 1800 + i * 13) % 40);
      return {
        name: b.name,
        points: b.base + mins * (3 + i) + pulse * (i + 2),
        bot: true,
      };
    });
    board.push({ name: state.name + " (you)", points: state.points, you: true });
    board.sort((a, b) => b.points - a.points);
    localStorage.setItem(BOARD, JSON.stringify(board));

    global.dispatchEvent(
      new CustomEvent("rta:tick", {
        detail: {
          state,
          board,
          passive,
          level: levelFor(state.points),
          online: onlineNow(),
        },
      })
    );
    return { state, board, passive };
  }

  function getBoard() {
    tick();
    return JSON.parse(localStorage.getItem(BOARD) || "[]");
  }

  function getFeed() {
    return JSON.parse(localStorage.getItem(FEED) || "[]");
  }

  function setName(name) {
    const state = load();
    state.name = String(name || state.name).slice(0, 24);
    save(state);
    return state;
  }

  function join() {
    const state = load();
    if (!state.joined) {
      state.joined = true;
      save(state);
      return earn("join");
    }
    return { state, amount: 0 };
  }

  function format(n) {
    return Math.floor(n).toLocaleString("en-US");
  }

  global.RTAPoints = {
    REWARDS,
    LEVELS,
    load,
    save,
    earn,
    tick,
    getBoard,
    getFeed,
    setName,
    join,
    checkIn,
    levelFor,
    onlineNow,
    format,
  };
})(window);
