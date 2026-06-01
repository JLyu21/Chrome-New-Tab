const STORAGE_KEYS = {
  apps: "jay_newtab_apps",
  mode: "jay_newtab_mode",
  focus: "jay_newtab_focus_mode",
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
  timeZone: "system"
};

const state = {
  apps: [],
  mode: "dark",
  focusMode: false,
  timeZone: defaults.timeZone,
  calendarDate: new Date(),
  mediaTabId: null,
  mediaWindowId: null,
  mediaMuted: false,
  mediaPaused: true
};

const MEDIA_REFRESH_MS = 2500;

const ui = {
  greeting: document.getElementById("greeting"),
  heroTitle: document.getElementById("heroTitle"),
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
  mediaMeta: document.getElementById("mediaMeta"),
  mediaFavicon: document.getElementById("mediaFavicon"),
  mediaStatePill: document.getElementById("mediaStatePill"),
  mediaTitle: document.getElementById("mediaTitle"),
  mediaSource: document.getElementById("mediaSource"),
  mediaPrev: document.getElementById("mediaPrev"),
  mediaBack: document.getElementById("mediaBack"),
  mediaPlayPause: document.getElementById("mediaPlayPause"),
  mediaForward: document.getElementById("mediaForward"),
  mediaNext: document.getElementById("mediaNext"),
  mediaOpen: document.getElementById("mediaOpen"),
  mediaMute: document.getElementById("mediaMute"),
  mediaStatus: document.getElementById("mediaStatus")
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
  state.timeZone = localStorage.getItem(STORAGE_KEYS.timeZone) || defaults.timeZone;
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.apps, JSON.stringify(state.apps));
  localStorage.setItem(STORAGE_KEYS.mode, state.mode);
  localStorage.setItem(STORAGE_KEYS.focus, String(state.focusMode));
  localStorage.setItem(STORAGE_KEYS.timeZone, state.timeZone);
}

function updateGreeting(hour) {
  let message = "Good evening";
  if (hour < 12) message = "Good morning";
  else if (hour < 18) message = "Good afternoon";
  ui.greeting.textContent = `${message}, Jay`;
  ui.heroTitle.textContent = "Hi Jay";
}

function hasChromeTabsApi() {
  return typeof chrome !== "undefined" && chrome.tabs && typeof chrome.tabs.query === "function";
}

function hasChromeScriptingApi() {
  return typeof chrome !== "undefined" && chrome.scripting && typeof chrome.scripting.executeScript === "function";
}

function chromeTabsQuery(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      const error = chrome.runtime?.lastError;
      if (error) reject(error);
      else resolve(tabs);
    });
  });
}

function chromeTabsUpdate(tabId, updateProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updateProperties, (tab) => {
      const error = chrome.runtime?.lastError;
      if (error) reject(error);
      else resolve(tab);
    });
  });
}

function chromeExecuteScript(tabId, func, args = []) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        world: "MAIN",
        func,
        args
      },
      (results) => {
        const error = chrome.runtime?.lastError;
        if (error) reject(error);
        else resolve(results);
      }
    );
  });
}

function chromeWindowFocus(windowId) {
  if (!chrome.windows || typeof chrome.windows.update !== "function") return Promise.resolve();
  return new Promise((resolve) => {
    chrome.windows.update(windowId, { focused: true }, () => resolve());
  });
}

function getTabHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Chrome tab";
  }
}

function getMediaSnapshotFromPage() {
  const text = (selector) => document.querySelector(selector)?.textContent?.trim() || "";
  const attr = (selector, name) => document.querySelector(selector)?.getAttribute(name) || "";
  const meta = (name) =>
    attr(`meta[property="${name}"]`, "content") ||
    attr(`meta[name="${name}"]`, "content");
  const mediaSessionMetadata = navigator.mediaSession?.metadata || null;
  const mediaElements = Array.from(document.querySelectorAll("video,audio"));
  const activeMedia =
    mediaElements.find((item) => !item.paused) ||
    mediaElements.find((item) => item.currentTime > 0) ||
    mediaElements[0] ||
    null;
  const artwork = Array.from(mediaSessionMetadata?.artwork || [])
    .filter((item) => item.src)
    .sort((a, b) => {
      const aSize = Number.parseInt(String(a.sizes || "0").split("x")[0], 10) || 0;
      const bSize = Number.parseInt(String(b.sizes || "0").split("x")[0], 10) || 0;
      return bSize - aSize;
    })[0]?.src;
  const title =
    mediaSessionMetadata?.title ||
    text('[data-testid="context-item-info-title"]') ||
    text(".ytp-title-link") ||
    text("h1.ytd-watch-metadata yt-formatted-string") ||
    meta("og:title") ||
    meta("twitter:title") ||
    document.title ||
    "";
  const artist =
    mediaSessionMetadata?.artist ||
    text('[data-testid="context-item-info-artist"]') ||
    text('a[data-testid="context-item-info-artist"]') ||
    text("ytd-video-owner-renderer #text a") ||
    text("#owner #channel-name a") ||
    "";
  const album = mediaSessionMetadata?.album || "";
  const image =
    artwork ||
    meta("og:image") ||
    meta("twitter:image") ||
    attr('link[rel="image_src"]', "href") ||
    attr('link[rel="apple-touch-icon"]', "href") ||
    "";
  const absoluteImage = (() => {
    try {
      return image ? new URL(image, location.href).href : "";
    } catch {
      return "";
    }
  })();

  return {
    title,
    artist,
    album,
    artwork: absoluteImage,
    paused: activeMedia ? activeMedia.paused : true,
    currentTime: activeMedia ? activeMedia.currentTime || 0 : 0,
    duration: activeMedia && Number.isFinite(activeMedia.duration) ? activeMedia.duration : 0,
    hasMedia: Boolean(activeMedia),
    source: location.hostname.replace(/^www\./, ""),
    pageTitle: document.title || ""
  };
}

function runMediaCommandOnPage(command) {
  const mediaElements = Array.from(document.querySelectorAll("video,audio"));
  const activeMedia =
    mediaElements.find((item) => !item.paused) ||
    mediaElements.find((item) => item.currentTime > 0) ||
    mediaElements[0] ||
    null;
  const clickFirst = (selectors) => {
    const button = selectors.map((selector) => document.querySelector(selector)).find(Boolean);
    if (!button) return false;
    button.click();
    return true;
  };

  if (command === "playPause") {
    if (activeMedia) {
      if (activeMedia.paused) activeMedia.play?.();
      else activeMedia.pause?.();
      return { handled: true };
    }
    return {
      handled: clickFirst([
        'button[data-testid="control-button-playpause"]',
        ".ytp-play-button",
        '[aria-label="Play"]',
        '[aria-label="Pause"]',
        '[title="Play"]',
        '[title="Pause"]'
      ])
    };
  }

  if (command === "back" || command === "forward") {
    if (!activeMedia) return { handled: false };
    const offset = command === "back" ? -10 : 10;
    activeMedia.currentTime = Math.max(0, Math.min(activeMedia.duration || Infinity, activeMedia.currentTime + offset));
    return { handled: true };
  }

  if (command === "next") {
    return {
      handled: clickFirst([
        'button[data-testid="control-button-skip-forward"]',
        ".ytp-next-button",
        '[aria-label="Next"]',
        '[aria-label="Next video"]',
        '[title="Next"]'
      ])
    };
  }

  if (command === "previous") {
    const handled = clickFirst([
      'button[data-testid="control-button-skip-back"]',
      ".ytp-prev-button",
      '[aria-label="Previous"]',
      '[title="Previous"]'
    ]);
    if (handled) return { handled: true };
    if (activeMedia) {
      activeMedia.currentTime = 0;
      return { handled: true };
    }
  }

  return { handled: false };
}

function cleanMediaTitle(title, host) {
  const cleaned = String(title || "")
    .replace(/\s*-\s*YouTube$/i, "")
    .replace(/\s*\|\s*Spotify.*$/i, "")
    .replace(/\s*-\s*Spotify$/i, "")
    .replace(/\s*-\s*Netease Music$/i, "")
    .trim();
  return cleaned || `Audio from ${host}`;
}

function formatMediaTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function setMediaControlsEnabled(enabled) {
  [ui.mediaPrev, ui.mediaBack, ui.mediaPlayPause, ui.mediaForward, ui.mediaNext, ui.mediaOpen, ui.mediaMute].forEach(
    (button) => {
      button.disabled = !enabled;
    }
  );
}

function isInjectableTab(tab) {
  return /^https?:\/\//i.test(tab.url || "");
}

async function readMediaDetails(tab) {
  if (!hasChromeScriptingApi() || !isInjectableTab(tab)) return null;
  const results = await chromeExecuteScript(tab.id, getMediaSnapshotFromPage);
  return results?.[0]?.result || null;
}

async function sendMediaCommand(command) {
  if (!state.mediaTabId || !hasChromeScriptingApi()) return;
  try {
    const results = await chromeExecuteScript(state.mediaTabId, runMediaCommandOnPage, [command]);
    const handled = results?.[0]?.result?.handled;
    ui.mediaStatus.textContent = handled ? "Command sent" : "Control unavailable";
    setTimeout(refreshMediaPanel, 350);
  } catch (error) {
    ui.mediaStatus.textContent = error.message || "Command blocked";
  }
}

function renderMediaIdle() {
  state.mediaTabId = null;
  state.mediaWindowId = null;
  state.mediaMuted = false;
  state.mediaPaused = true;
  ui.mediaMeta.textContent = "Idle";
  ui.mediaStatePill.textContent = "No audio detected";
  ui.mediaTitle.textContent = "Nothing playing in Chrome";
  ui.mediaSource.textContent = "Start YouTube, Spotify web, or Netease web in another tab.";
  ui.mediaStatus.textContent = "Ready";
  ui.mediaFavicon.removeAttribute("src");
  ui.mediaFavicon.alt = "";
  ui.mediaFavicon.classList.remove("cover-art");
  setMediaControlsEnabled(false);
  ui.mediaPlayPause.textContent = "Play";
  ui.mediaMute.textContent = "Mute";
}

function renderMediaUnavailable(message) {
  state.mediaTabId = null;
  state.mediaWindowId = null;
  state.mediaMuted = false;
  state.mediaPaused = true;
  ui.mediaMeta.textContent = "Permission needed";
  ui.mediaStatePill.textContent = "Chrome access blocked";
  ui.mediaTitle.textContent = "Reload the extension";
  ui.mediaSource.textContent = "Chrome needs tabs, scripting, and site permissions before this panel can control browser audio.";
  ui.mediaStatus.textContent = message || "Open chrome://extensions";
  ui.mediaFavicon.removeAttribute("src");
  ui.mediaFavicon.alt = "";
  ui.mediaFavicon.classList.remove("cover-art");
  setMediaControlsEnabled(false);
  ui.mediaPlayPause.textContent = "Play";
  ui.mediaMute.textContent = "Mute";
}

function renderMediaTab(tab, details = null) {
  const host = getTabHost(tab.url);
  const muted = Boolean(tab.mutedInfo?.muted);
  const paused = details?.hasMedia ? Boolean(details.paused) : !tab.audible;
  const title = details?.title || tab.title;
  const sourceParts = [details?.artist, details?.album].filter(Boolean);
  const source = sourceParts.length ? sourceParts.join(" - ") : details?.source || host;
  const durationText = details?.duration ? ` // ${formatMediaTime(details.currentTime)} / ${formatMediaTime(details.duration)}` : "";

  state.mediaTabId = tab.id;
  state.mediaWindowId = tab.windowId;
  state.mediaMuted = muted;
  state.mediaPaused = paused;

  ui.mediaMeta.textContent = muted ? "Muted tab" : paused ? "Paused tab" : "Live tab";
  ui.mediaStatePill.textContent = muted ? "Muted" : paused ? "Paused" : "Playing now";
  ui.mediaTitle.textContent = cleanMediaTitle(title, host);
  ui.mediaSource.textContent = source;
  ui.mediaStatus.textContent = `${tab.active ? "Current window" : "Background tab"}${durationText}`;
  ui.mediaFavicon.src = details?.artwork || tab.favIconUrl || getFallbackIcon(tab.url || "", host);
  ui.mediaFavicon.alt = `${host} icon`;
  ui.mediaFavicon.classList.toggle("cover-art", Boolean(details?.artwork));
  setMediaControlsEnabled(true);
  ui.mediaPlayPause.textContent = paused ? "Play" : "Pause";
  ui.mediaMute.textContent = muted ? "Unmute" : "Mute";
}

async function refreshMediaPanel() {
  if (!hasChromeTabsApi()) {
    renderMediaUnavailable("Loaded as file");
    return;
  }
  if (!hasChromeScriptingApi()) {
    renderMediaUnavailable("Reload extension");
    return;
  }

  try {
    const tabs = await chromeTabsQuery({});
    const browserTabs = tabs.filter(isInjectableTab);
    const mediaTab =
      browserTabs.find((tab) => tab.audible) ||
      browserTabs.find((tab) => tab.id === state.mediaTabId);

    if (!mediaTab) {
      renderMediaIdle();
      return;
    }

    const details = await readMediaDetails(mediaTab);
    renderMediaTab(mediaTab, details);
  } catch (error) {
    renderMediaUnavailable(error.message);
  }
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
  ui.mediaPrev.addEventListener("click", () => {
    sendMediaCommand("previous");
  });
  ui.mediaBack.addEventListener("click", () => {
    sendMediaCommand("back");
  });
  ui.mediaPlayPause.addEventListener("click", () => {
    sendMediaCommand("playPause");
  });
  ui.mediaForward.addEventListener("click", () => {
    sendMediaCommand("forward");
  });
  ui.mediaNext.addEventListener("click", () => {
    sendMediaCommand("next");
  });
  ui.mediaOpen.addEventListener("click", async () => {
    if (!state.mediaTabId || !hasChromeTabsApi()) return;
    try {
      await chromeTabsUpdate(state.mediaTabId, { active: true });
      await chromeWindowFocus(state.mediaWindowId);
      refreshMediaPanel();
    } catch (error) {
      renderMediaUnavailable(error.message);
    }
  });
  ui.mediaMute.addEventListener("click", async () => {
    if (!state.mediaTabId || !hasChromeTabsApi()) return;
    try {
      await chromeTabsUpdate(state.mediaTabId, { muted: !state.mediaMuted });
      refreshMediaPanel();
    } catch (error) {
      renderMediaUnavailable(error.message);
    }
  });
}

function hydrateUiState() {
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
  refreshMediaPanel();
  setInterval(refreshMediaPanel, MEDIA_REFRESH_MS);
  setupEvents();
  persistState();
}

init();

