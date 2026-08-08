/**
 * RanToAtlanta FOMO points engine
 * Points climb from every interaction + passive live tick.
 */
(function (global) {
  const STORE = "rta-points-v2";
  const BOARD = "rta-board-v2";
  const FEED = "rta-feed-v2";

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
  };

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

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "null") || defaultState();
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
      lastTick: Date.now(),
      createdAt: Date.now(),
    };
  }

  function save(state) {
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function pushFeed(entry) {
    const items = JSON.parse(localStorage.getItem(FEED) || "[]");
    items.unshift({ ...entry, t: Date.now() });
    localStorage.setItem(FEED, JSON.stringify(items.slice(0, 60)));
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
        detail: { state, action, amount, meta },
      })
    );
    return { state, amount };
  }

  /** Passive FOMO: your score + community board always climb */
  function tick() {
    const state = load();
    const now = Date.now();
    const elapsed = Math.max(0, now - (state.lastTick || now));
    // ~1 pt every 2.2s while tab open, plus tiny catch-up
    const passive = Math.min(12, Math.floor(elapsed / 2200) + 1);
    state.points += passive;
    state.lastTick = now;
    save(state);

    // Community board: climb from launch epoch, stay human-scale
    const launch = Date.UTC(2026, 7, 8, 14, 0, 0); // Aug 8 2026 launch window
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
        detail: { state, board, passive },
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
    load,
    save,
    earn,
    tick,
    getBoard,
    getFeed,
    setName,
    join,
    format,
  };
})(window);
