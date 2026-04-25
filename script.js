const STORAGE_KEYS = {
  apps: "jay_newtab_apps",
  mode: "jay_newtab_mode",
  focus: "jay_newtab_focus_mode",
  sports: "jay_newtab_sports_preferences",
  timeZone: "jay_newtab_timezone"
};

const defaults = {
  apps: [
    { id: crypto.randomUUID(), name: "ChatGPT", url: "https://chatgpt.com", iconUrl: "" },
    { id: crypto.randomUUID(), name: "Google Drive", url: "https://drive.google.com", iconUrl: "" },
    { id: crypto.randomUUID(), name: "FMHY", url: "https://fmhy.net", iconUrl: "" },
    { id: crypto.randomUUID(), name: "Netease", url: "https://music.163.com/#/", iconUrl: "" },
    { id: crypto.randomUUID(), name: "YouTube", url: "https://youtube.com", iconUrl: "" }
  ],
  sports: {
    showNba: true,
    showSoccer: true,
    showF1: true
  },
  timeZone: "system"
};

const state = {
  apps: [],
  mode: "dark",
  focusMode: false,
  sports: { ...defaults.sports },
  timeZone: defaults.timeZone,
  calendarDate: new Date()
};

const BIRTHDAY = new Date("2006-12-20T22:05:00");

const ui = {
  greeting: document.getElementById("greeting"),
  heroTitle: document.getElementById("heroTitle"),
  liveAge: document.getElementById("liveAge"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  timeZoneSelect: document.getElementById("timeZoneSelect"),
  modeToggle: document.getElementById("modeToggle"),
  focusToggle: document.getElementById("focusToggle"),
  appFormToggle: document.getElementById("appFormToggle"),
  appForm: document.getElementById("appForm"),
  appName: document.getElementById("appName"),
  appUrl: document.getElementById("appUrl"),
  appIcon: document.getElementById("appIcon"),
  appGrid: document.getElementById("appGrid"),
  appTemplate: document.getElementById("appItemTemplate"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  calendarLabel: document.getElementById("calendarLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  dayProgressValue: document.getElementById("dayProgressValue"),
  dayProgressBar: document.getElementById("dayProgressBar"),
  yearProgressValue: document.getElementById("yearProgressValue"),
  yearProgressBar: document.getElementById("yearProgressBar"),
  toggleNba: document.getElementById("toggleNba"),
  toggleSoccer: document.getElementById("toggleSoccer"),
  toggleF1: document.getElementById("toggleF1"),
  refreshSports: document.getElementById("refreshSports"),
  sportsMeta: document.getElementById("sportsMeta"),
  sportsCards: document.getElementById("sportsCards")
};

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function getClockTimeZone() {
  return state.timeZone === "system" ? undefined : state.timeZone;
}

function loadState() {
  state.apps = safeParse(localStorage.getItem(STORAGE_KEYS.apps), defaults.apps);
  state.mode = localStorage.getItem(STORAGE_KEYS.mode) || "dark";
  state.focusMode = localStorage.getItem(STORAGE_KEYS.focus) === "true";
  state.sports = { ...defaults.sports, ...safeParse(localStorage.getItem(STORAGE_KEYS.sports), {}) };
  state.timeZone = localStorage.getItem(STORAGE_KEYS.timeZone) || defaults.timeZone;
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.apps, JSON.stringify(state.apps));
  localStorage.setItem(STORAGE_KEYS.mode, state.mode);
  localStorage.setItem(STORAGE_KEYS.focus, String(state.focusMode));
  localStorage.setItem(STORAGE_KEYS.sports, JSON.stringify(state.sports));
  localStorage.setItem(STORAGE_KEYS.timeZone, state.timeZone);
}

function updateGreeting(hour) {
  let message = "Good evening";
  if (hour < 12) message = "Good morning";
  else if (hour < 18) message = "Good afternoon";
  ui.greeting.textContent = `${message}, Jay`;
  ui.heroTitle.textContent = "Hi Jay";
}

function updateLiveAge(now) {
  const years = (now.getTime() - BIRTHDAY.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
  ui.liveAge.textContent = `Age: ${years.toFixed(9)} years`;
}

function updateProgress(now) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayProgress = ((now - dayStart) / 86400000) * 100;

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = ((now - yearStart) / (nextYearStart - yearStart)) * 100;

  ui.dayProgressValue.textContent = `${dayProgress.toFixed(1)}%`;
  ui.dayProgressBar.style.width = `${Math.min(100, Math.max(0, dayProgress))}%`;
  ui.yearProgressValue.textContent = `${yearProgress.toFixed(1)}%`;
  ui.yearProgressBar.style.width = `${Math.min(100, Math.max(0, yearProgress))}%`;
}

function updateClock() {
  const tz = getClockTimeZone();
  const now = new Date();
  ui.clock.textContent = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: tz
  }).format(now);
  ui.date.textContent = new Intl.DateTimeFormat([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(now)
  );
  updateGreeting(hour);
  updateLiveAge(now);
  updateProgress(now);
}

function applyMode() {
  document.body.classList.toggle("light", state.mode === "light");
  ui.modeToggle.textContent = state.mode === "dark" ? "Switch to light" : "Switch to dark";
}

function applyFocusMode() {
  document.body.classList.toggle("focus-mode", state.focusMode);
  ui.focusToggle.textContent = state.focusMode ? "Exit focus" : "Focus mode";
}

function getFallbackIcon(url, name) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=334155&color=fff`;
  }
}

function renderApps() {
  ui.appGrid.innerHTML = "";
  state.apps.forEach((app) => {
    const fragment = ui.appTemplate.content.cloneNode(true);
    const link = fragment.querySelector(".app-link");
    const logo = fragment.querySelector(".app-logo");
    const name = fragment.querySelector(".app-name");
    const remove = fragment.querySelector(".app-delete");
    link.href = app.url;
    link.title = app.url;
    logo.src = app.iconUrl || getFallbackIcon(app.url, app.name);
    logo.alt = `${app.name} icon`;
    name.textContent = app.name;
    remove.addEventListener("click", () => {
      state.apps = state.apps.filter((item) => item.id !== app.id);
      persistState();
      renderApps();
    });
    ui.appGrid.appendChild(fragment);
  });
}

function setAppFormOpen(isOpen) {
  ui.appForm.hidden = !isOpen;
  ui.appFormToggle.setAttribute("aria-expanded", String(isOpen));
  ui.appFormToggle.textContent = isOpen ? "Hide fields" : "Add shortcut";
  if (isOpen) ui.appName.focus();
}

function renderCalendar() {
  const current = state.calendarDate;
  const year = current.getFullYear();
  const month = current.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  ui.calendarLabel.textContent = current.toLocaleDateString([], { month: "long", year: "numeric" });
  ui.calendarGrid.innerHTML = "";
  dayNames.forEach((day) => {
    const el = document.createElement("div");
    el.className = "calendar-cell day-name";
    el.textContent = day;
    ui.calendarGrid.appendChild(el);
  });
  for (let i = 0; i < startDay; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell muted-day";
    ui.calendarGrid.appendChild(empty);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.textContent = String(day);
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) cell.classList.add("today");
    ui.calendarGrid.appendChild(cell);
  }
}

function isoNowAddHours(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

function getFallbackSportsData() {
  return [
    {
      key: "nba",
      league: "NBA",
      status: "upcoming",
      date: isoNowAddHours(2),
      home: { name: "Lakers", score: "", record: "44-31", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png" },
      away: { name: "Warriors", score: "", record: "42-33", logo: "https://a.espncdn.com/i/teamlogos/nba/500/gs.png" }
    },
    {
      key: "nba",
      league: "NBA",
      status: "upcoming",
      date: isoNowAddHours(18),
      home: { name: "Celtics", score: "", record: "58-20", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png" },
      away: { name: "Bucks", score: "", record: "47-31", logo: "https://a.espncdn.com/i/teamlogos/nba/500/mil.png" }
    },
    {
      key: "nba",
      league: "NBA",
      status: "upcoming",
      date: isoNowAddHours(26),
      home: { name: "Suns", score: "", record: "46-32", logo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png" },
      away: { name: "Nuggets", score: "", record: "52-27", logo: "https://a.espncdn.com/i/teamlogos/nba/500/den.png" }
    },
    {
      key: "soccer",
      league: "Champions League",
      status: "upcoming",
      date: isoNowAddHours(18),
      home: { name: "Real Madrid", score: "", record: "", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/86.png" },
      away: { name: "Bayern", score: "", record: "", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png" }
    },
    {
      key: "f1",
      league: "Formula 1",
      status: "finished",
      date: isoNowAddHours(-8),
      home: { name: "Max Verstappen", score: "1", record: "", logo: "https://a.espncdn.com/i/teamlogos/racing/500/f1.png" },
      away: { name: "Lando Norris", score: "2", record: "", logo: "https://a.espncdn.com/i/teamlogos/racing/500/f1.png" },
      note: "Race result"
    }
  ];
}

function looksLikeUrl(value) {
  return /^[a-zA-Z]+:\/\//.test(value) || /^www\./.test(value);
}

function runSearch(rawValue) {
  const value = rawValue.trim();
  if (!value) return;
  let target = "";
  if (looksLikeUrl(value)) {
    target = normalizeUrl(value);
  } else {
    target = `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  }
  window.location.href = target;
}

function pickStatus(event) {
  const st = (event.status?.type?.state || "").toLowerCase();
  if (st === "in") return "live";
  if (st === "post") return "finished";
  return "upcoming";
}

function parseEspnEvent(key, league, event) {
  const comps = event.competitions?.[0];
  const competitors = comps?.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home") || competitors[0];
  const away = competitors.find((c) => c.homeAway === "away") || competitors[1];
  if (!home || !away) return null;
  const homeTeam = home.team || {};
  const awayTeam = away.team || {};
  const rec = (teamObj) => teamObj.records?.[0]?.summary || "";
  const status = event.status || comps.status || {};
  const statusType = status.type || {};
  const displayClock = status.displayClock || "";
  const period = status.period || "";
  const detail = statusType.shortDetail || statusType.detail || statusType.description || event.status?.type?.detail || "";
  return {
    key,
    league,
    status: pickStatus(event),
    date: event.date,
    displayClock,
    period,
    detail,
    note: detail,
    home: {
      name: homeTeam.shortDisplayName || homeTeam.displayName || "Home",
      score: home.score || "",
      record: rec(home),
      logo: homeTeam.logo || ""
    },
    away: {
      name: awayTeam.shortDisplayName || awayTeam.displayName || "Away",
      score: away.score || "",
      record: rec(away),
      logo: awayTeam.logo || ""
    }
  };
}

function formatLiveDetail(event) {
  if (event.status !== "live") return event.detail || "";
  const parts = [];
  if (event.key === "nba" && event.period) parts.push(`Q${event.period}`);
  else if (event.key === "f1" && event.period) parts.push(`Lap ${event.period}`);
  else if (event.key === "soccer" && event.displayClock) parts.push(event.displayClock);
  else if (event.period) parts.push(`Period ${event.period}`);
  if (event.key !== "soccer" && event.displayClock) parts.push(event.displayClock);
  const joined = parts.join(" ");
  if (joined) return joined;
  return event.detail || "Live now";
}

function getStatusLabel(event) {
  if (event.status === "live") return `LIVE · ${formatLiveDetail(event)}`;
  if (event.status === "finished") return "FINAL";
  return event.status.toUpperCase();
}

function getEventTimeText(event) {
  if (event.status === "live") return event.detail || formatLiveDetail(event);
  return new Date(event.date).toLocaleString([], { timeZone: getClockTimeZone() });
}

async function fetchEspnJson(url) {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchSportsEvents() {
  const tasks = [];
  if (state.sports.showNba) {
    tasks.push(
      fetchEspnJson("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard")
        .then((data) => (data.events || []).map((e) => parseEspnEvent("nba", "NBA", e)).filter(Boolean))
    );
    const dateOffsetTargets = [1, 2, 3];
    dateOffsetTargets.forEach((offsetDays) => {
      const target = new Date();
      target.setDate(target.getDate() + offsetDays);
      const dateStr = `${target.getFullYear()}${String(target.getMonth() + 1).padStart(2, "0")}${String(target.getDate()).padStart(2, "0")}`;
      tasks.push(
        fetchEspnJson(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`)
          .then((data) => (data.events || []).map((e) => parseEspnEvent("nba", "NBA", e)).filter(Boolean))
      );
    });
  }
  if (state.sports.showSoccer) {
    const leagues = [
      ["eng.1", "Premier League"],
      ["esp.1", "LaLiga"],
      ["ger.1", "Bundesliga"],
      ["ita.1", "Serie A"],
      ["fra.1", "Ligue 1"],
      ["uefa.champions", "Champions League"]
    ];
    leagues.forEach(([code, name]) => {
      tasks.push(fetchEspnJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard`)
        .then((data) => (data.events || []).map((e) => parseEspnEvent("soccer", name, e)).filter(Boolean)));
    });
  }
  if (state.sports.showF1) {
    tasks.push(fetchEspnJson("https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard")
      .then((data) => (data.events || []).map((e) => parseEspnEvent("f1", "Formula 1", e)).filter(Boolean)));
  }
  const settled = await Promise.allSettled(tasks);
  const events = settled
    .filter((item) => item.status === "fulfilled")
    .flatMap((item) => item.value);
  const unique = new Map();
  events.forEach((event) => {
    const key = `${event.league}-${event.home.name}-${event.away.name}-${event.date}`;
    unique.set(key, event);
  });
  return Array.from(unique.values());
}

function eventSortValue(status) {
  if (status === "live") return 0;
  if (status === "upcoming") return 1;
  return 2;
}

function renderTeamRow(team) {
  return `
    <div class="team-row">
      <img class="team-logo" src="${team.logo || "https://www.google.com/s2/favicons?domain=espn.com&sz=128"}" alt="${team.name}" />
      <div class="team-main">
        <span class="team-name">${team.name}</span>
        <span class="team-record">${team.record || "&nbsp;"}</span>
      </div>
      <span class="team-score">${team.score || "-"}</span>
    </div>
  `;
}

function renderSportsCards(events) {
  ui.sportsCards.innerHTML = "";
  if (!events.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No events found for selected sports.";
    ui.sportsCards.appendChild(empty);
    return;
  }
  const groups = {
    live: events.filter((e) => e.status === "live"),
    upcoming: events.filter((e) => e.status === "upcoming"),
    finished: events.filter((e) => e.status === "finished")
  };
  ["live", "upcoming", "finished"].forEach((groupKey) => {
    if (!groups[groupKey].length) return;
    const title = document.createElement("p");
    title.className = "sport-group-title";
    title.textContent = groupKey;
    ui.sportsCards.appendChild(title);
    const groupEvents = groups[groupKey].sort((a, b) => {
      if (groupKey === "upcoming" && a.key !== b.key) {
        if (a.key === "nba") return -1;
        if (b.key === "nba") return 1;
      }
      return new Date(a.date) - new Date(b.date);
    });
    const maxItems = groupKey === "upcoming" ? 8 : 5;
    groupEvents.slice(0, maxItems).forEach((event) => {
      const card = document.createElement("article");
      card.className = "sport-card";
      card.innerHTML = `
        <div class="sport-head">
          <span class="sport-league">${event.league}</span>
          <span class="sport-status ${event.status}">${getStatusLabel(event)}</span>
        </div>
        <div class="sport-match">
          ${renderTeamRow(event.away)}
          ${renderTeamRow(event.home)}
        </div>
        <p class="sport-time">${getEventTimeText(event)}</p>
        <p class="sport-extra">${event.status === "live" ? "Live game detail updates with the feed." : event.note || ""}</p>
      `;
      ui.sportsCards.appendChild(card);
    });
  });
}

async function loadSports() {
  ui.sportsMeta.textContent = "Refreshing sports feed...";
  try {
    const events = await fetchSportsEvents();
    const filtered = events
      .filter((e) => (e.key === "nba" && state.sports.showNba) || (e.key === "soccer" && state.sports.showSoccer) || (e.key === "f1" && state.sports.showF1))
      .sort((a, b) => eventSortValue(a.status) - eventSortValue(b.status) || new Date(a.date) - new Date(b.date));
    if (!filtered.length) throw new Error("no events");
    renderSportsCards(filtered);
    ui.sportsMeta.textContent = "Live/upcoming/final from ESPN scoreboard feeds.";
  } catch {
    const fallback = getFallbackSportsData().filter((e) =>
      (e.key === "nba" && state.sports.showNba) ||
      (e.key === "soccer" && state.sports.showSoccer) ||
      (e.key === "f1" && state.sports.showF1)
    );
    renderSportsCards(fallback);
    ui.sportsMeta.textContent = "Feed unavailable now, showing fallback schedule.";
  }
}

function setupEvents() {
  ui.modeToggle.addEventListener("click", () => {
    state.mode = state.mode === "dark" ? "light" : "dark";
    persistState();
    applyMode();
  });
  ui.focusToggle.addEventListener("click", () => {
    state.focusMode = !state.focusMode;
    persistState();
    applyFocusMode();
  });
  ui.timeZoneSelect.addEventListener("change", () => {
    state.timeZone = ui.timeZoneSelect.value;
    persistState();
    updateClock();
  });
  ui.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch(ui.searchInput.value);
  });
  ui.appFormToggle.addEventListener("click", () => {
    setAppFormOpen(ui.appForm.hidden);
  });
  ui.appForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = ui.appName.value.trim();
    const rawUrl = ui.appUrl.value.trim();
    const icon = ui.appIcon.value.trim();
    if (!name || !rawUrl) return;
    const url = normalizeUrl(rawUrl);
    try {
      new URL(url);
    } catch {
      alert("Please enter a valid app URL.");
      return;
    }
    state.apps.push({ id: crypto.randomUUID(), name, url, iconUrl: icon });
    ui.appForm.reset();
    setAppFormOpen(false);
    persistState();
    renderApps();
  });
  ui.prevMonth.addEventListener("click", () => {
    state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1);
    renderCalendar();
  });
  ui.nextMonth.addEventListener("click", () => {
    state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1);
    renderCalendar();
  });
  ui.toggleNba.addEventListener("change", () => {
    state.sports.showNba = ui.toggleNba.checked;
    persistState();
    loadSports();
  });
  ui.toggleSoccer.addEventListener("change", () => {
    state.sports.showSoccer = ui.toggleSoccer.checked;
    persistState();
    loadSports();
  });
  ui.toggleF1.addEventListener("change", () => {
    state.sports.showF1 = ui.toggleF1.checked;
    persistState();
    loadSports();
  });
  ui.refreshSports.addEventListener("click", () => {
    loadSports();
  });
}

function hydrateUiState() {
  ui.toggleNba.checked = state.sports.showNba;
  ui.toggleSoccer.checked = state.sports.showSoccer;
  ui.toggleF1.checked = state.sports.showF1;
  ui.timeZoneSelect.value = state.timeZone;
}

function init() {
  loadState();
  hydrateUiState();
  updateClock();
  setInterval(updateClock, 1000);
  applyMode();
  applyFocusMode();
  renderApps();
  renderCalendar();
  loadSports();
  setupEvents();
  persistState();
}

init();
