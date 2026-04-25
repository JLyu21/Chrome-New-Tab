const STORAGE_KEYS = {
  todos: "focus_newtab_todos",
  links: "focus_newtab_links",
  appearance: "focus_newtab_appearance",
  mode: "focus_newtab_mode"
};

const defaults = {
  links: [
    { id: crypto.randomUUID(), name: "Gmail", url: "https://mail.google.com" },
    { id: crypto.randomUUID(), name: "YouTube", url: "https://www.youtube.com" },
    { id: crypto.randomUUID(), name: "GitHub", url: "https://github.com" }
  ],
  appearance: {
    colorStart: "#1d4ed8",
    colorEnd: "#9333ea",
    imageUrl: ""
  }
};

const state = {
  todos: [],
  links: [],
  appearance: { ...defaults.appearance },
  mode: "light"
};

const ui = {
  greeting: document.getElementById("greeting"),
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  todoForm: document.getElementById("todoForm"),
  todoInput: document.getElementById("todoInput"),
  todoList: document.getElementById("todoList"),
  linkForm: document.getElementById("linkForm"),
  linkName: document.getElementById("linkName"),
  linkUrl: document.getElementById("linkUrl"),
  quickLinks: document.getElementById("quickLinks"),
  colorStart: document.getElementById("colorStart"),
  colorEnd: document.getElementById("colorEnd"),
  backgroundImage: document.getElementById("backgroundImage"),
  saveAppearance: document.getElementById("saveAppearance"),
  clearImage: document.getElementById("clearImage"),
  modeToggle: document.getElementById("modeToggle"),
  todoTemplate: document.getElementById("todoItemTemplate"),
  linkTemplate: document.getElementById("linkItemTemplate")
};

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  state.todos = safeParse(localStorage.getItem(STORAGE_KEYS.todos), []);
  state.links = safeParse(localStorage.getItem(STORAGE_KEYS.links), defaults.links);
  state.appearance = {
    ...defaults.appearance,
    ...safeParse(localStorage.getItem(STORAGE_KEYS.appearance), {})
  };
  state.mode = localStorage.getItem(STORAGE_KEYS.mode) || "light";
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(state.todos));
  localStorage.setItem(STORAGE_KEYS.links, JSON.stringify(state.links));
  localStorage.setItem(STORAGE_KEYS.appearance, JSON.stringify(state.appearance));
  localStorage.setItem(STORAGE_KEYS.mode, state.mode);
}

function updateClock() {
  const now = new Date();
  ui.clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  ui.date.textContent = now.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  updateGreeting(now.getHours());
}

function updateGreeting(hour) {
  if (hour < 12) {
    ui.greeting.textContent = "Good morning";
    return;
  }
  if (hour < 18) {
    ui.greeting.textContent = "Good afternoon";
    return;
  }
  ui.greeting.textContent = "Good evening";
}

function applyMode() {
  document.body.classList.toggle("dark", state.mode === "dark");
  ui.modeToggle.textContent = state.mode === "dark" ? "Switch to light" : "Switch to dark";
}

function applyAppearance() {
  document.documentElement.style.setProperty("--bg-start", state.appearance.colorStart);
  document.documentElement.style.setProperty("--bg-end", state.appearance.colorEnd);

  if (state.appearance.imageUrl) {
    const encodedUrl = state.appearance.imageUrl.replace(/"/g, "%22");
    document.body.style.backgroundImage = `linear-gradient(145deg, var(--bg-start), var(--bg-end)), url("${encodedUrl}")`;
  } else {
    document.body.style.backgroundImage = "linear-gradient(145deg, var(--bg-start), var(--bg-end))";
  }

  ui.colorStart.value = state.appearance.colorStart;
  ui.colorEnd.value = state.appearance.colorEnd;
  ui.backgroundImage.value = state.appearance.imageUrl;
}

function renderTodos() {
  ui.todoList.innerHTML = "";

  state.todos.forEach((todo) => {
    const fragment = ui.todoTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const checkbox = fragment.querySelector(".todo-check");
    const text = fragment.querySelector(".todo-text");
    const removeButton = fragment.querySelector(".todo-delete");

    checkbox.checked = todo.done;
    text.textContent = todo.text;
    item.classList.toggle("completed", Boolean(todo.done));

    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      persistState();
      renderTodos();
    });

    removeButton.addEventListener("click", () => {
      state.todos = state.todos.filter((itemTodo) => itemTodo.id !== todo.id);
      persistState();
      renderTodos();
    });

    ui.todoList.appendChild(fragment);
  });
}

function renderLinks() {
  ui.quickLinks.innerHTML = "";

  state.links.forEach((link) => {
    const fragment = ui.linkTemplate.content.cloneNode(true);
    const anchor = fragment.querySelector(".link-anchor");
    const icon = fragment.querySelector(".link-icon");
    const name = fragment.querySelector(".link-name");
    const url = fragment.querySelector(".link-url");
    const removeButton = fragment.querySelector(".link-delete");
    let host = link.url;
    try {
      host = new URL(link.url).hostname.replace(/^www\./, "");
    } catch {
      host = link.url;
    }

    anchor.href = link.url;
    anchor.title = link.url;
    icon.textContent = link.name.charAt(0).toUpperCase();
    name.textContent = link.name;
    url.textContent = host;

    removeButton.addEventListener("click", () => {
      state.links = state.links.filter((itemLink) => itemLink.id !== link.id);
      persistState();
      renderLinks();
    });

    ui.quickLinks.appendChild(fragment);
  });
}

function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function setupEvents() {
  ui.todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = ui.todoInput.value.trim();
    if (!text) {
      return;
    }

    state.todos.unshift({ id: crypto.randomUUID(), text, done: false });
    ui.todoInput.value = "";
    persistState();
    renderTodos();
  });

  ui.linkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = ui.linkName.value.trim();
    const rawUrl = ui.linkUrl.value.trim();
    if (!name || !rawUrl) {
      return;
    }

    const url = normalizeUrl(rawUrl);
    try {
      new URL(url);
    } catch {
      alert("Please enter a valid link URL.");
      return;
    }

    state.links.push({ id: crypto.randomUUID(), name, url });
    ui.linkName.value = "";
    ui.linkUrl.value = "";
    persistState();
    renderLinks();
  });

  ui.saveAppearance.addEventListener("click", () => {
    state.appearance.colorStart = ui.colorStart.value;
    state.appearance.colorEnd = ui.colorEnd.value;
    state.appearance.imageUrl = ui.backgroundImage.value.trim();
    persistState();
    applyAppearance();
  });

  ui.clearImage.addEventListener("click", () => {
    state.appearance.imageUrl = "";
    ui.backgroundImage.value = "";
    persistState();
    applyAppearance();
  });

  ui.modeToggle.addEventListener("click", () => {
    state.mode = state.mode === "dark" ? "light" : "dark";
    persistState();
    applyMode();
  });
}

function init() {
  loadState();
  updateClock();
  setInterval(updateClock, 1000);

  applyMode();
  applyAppearance();
  renderTodos();
  renderLinks();
  setupEvents();
  persistState();
}

init();
