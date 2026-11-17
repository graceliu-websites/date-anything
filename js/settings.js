/* =========================================================
   SETTINGS: load / save / apply + the Extended Settings window
   ========================================================= */

const STORAGE_KEY = "dateAnything.comfortSettings";

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const clone = (o) => JSON.parse(JSON.stringify(o));

/* Merge saved values onto defaults so new settings added later still get a value */
function mergeDefaults(saved) {
  const out = clone(DEFAULT_SETTINGS);
  if (!saved || typeof saved !== "object") return out;
  for (const group of ["camera", "avatar", "lighting"]) {
    if (saved[group]) {
      for (const key in out[group]) {
        if (key in saved[group] && typeof saved[group][key] === typeof out[group][key]) {
          out[group][key] = saved[group][key];
        }
      }
    }
  }
  return out;
}

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeDefaults(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}
function safeSave(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); return true; }
  catch (e) { return false; }
}

/* ---------- ghost artwork (shared by game + settings previews) ---------- */
function ghostSVG(av) {
  const hats = {
    none: "",
    bow: `<path d="M50 20 34 10q-6 10 0 20zM50 20l16-10q6 10 0 20z" fill="${av.accent}"/><circle cx="50" cy="20" r="5" fill="${av.accent}"/>`,
    ears: `<path d="M24 34 22 8l20 16zM76 34l2-26-20 16z" fill="${av.color}" stroke="${av.accent}" stroke-width="3" stroke-linejoin="round"/>`,
    wizard: `<path d="M26 30 52 -6l22 36z" fill="${av.accent}"/><circle cx="50" cy="12" r="3" fill="#fff6a8"/><path d="M18 30h66" stroke="${av.accent}" stroke-width="6" stroke-linecap="round"/>`
  };
  return `<svg viewBox="0 -8 100 128" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 14C26 14 16 34 16 58v52l11-8 11 8 12-8 12 8 11-8 11 8V58C84 34 74 14 50 14z"
      fill="${av.color}" stroke="${av.accent}" stroke-width="3" stroke-linejoin="round"/>
    ${hats[av.hat] || ""}
    <ellipse cx="38" cy="54" rx="5" ry="7" fill="#2b2140"/>
    <ellipse cx="62" cy="54" rx="5" ry="7" fill="#2b2140"/>
    <ellipse cx="30" cy="68" rx="6" ry="3.5" fill="${av.accent}" opacity=".45"/>
    <ellipse cx="70" cy="68" rx="6" ry="3.5" fill="${av.accent}" opacity=".45"/>
    <path d="M44 70q6 6 12 0" fill="none" stroke="#2b2140" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
const avatarById = (id) => AVATARS.find((a) => a.id === id) || AVATARS[0];

/* =========================================================
   Settings object
   ========================================================= */
const Settings = {
  saved: safeLoad() || clone(DEFAULT_SETTINGS), // what's on disk
  current: null,                                // what's live right now
  listeners: [],
  isOpen: false,

  onChange(cb) { this.listeners.push(cb); },
  emit() {
    this.listeners.forEach((cb) => cb(this.current));
    $("#unsavedDot").hidden = !this.isDirty();
  },
  isDirty() { return JSON.stringify(this.current) !== JSON.stringify(this.saved); },

  set(group, key, value) {
    this.current[group][key] = value;
    this.emit();
    syncControls();
  },

  save() {
    const ok = safeSave(this.current);
    if (ok) this.saved = clone(this.current);
    const status = $("#saveStatus");
    status.textContent = ok
      ? `Saved ✓  ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : "Couldn't save (storage is blocked in this browser). Try Export instead.";
    status.className = "save-status " + (ok ? "ok" : "err");
    $("#saveBtn").classList.toggle("saved", ok);
    this.emit();
    return ok;
  },

  reset() {
    this.current = clone(DEFAULT_SETTINGS);
    this.emit();
    syncControls();
    $("#saveStatus").textContent = "Defaults restored. Press Save to keep them.";
    $("#saveStatus").className = "save-status";
  }
};
Settings.current = clone(Settings.saved);

/* =========================================================
   Wire up the controls
   ========================================================= */
// [inputId, group, key, outputFormatter]
const SLIDERS = [
  ["camSpeed", "camera", "speed", (v) => v],
  ["camHeight", "camera", "height", null],
  ["camDistance", "camera", "distance", null],
  ["camZoom", "camera", "zoom", (v) => v + "%"],
  ["brightness", "lighting", "brightness", (v) => v + "%"],
  ["avatarOpacity", "avatar", "opacity", (v) => v + "%"]
];
const CHECKS = [
  ["steadyCam", "camera", "steadyCam"],
  ["motionBlur", "camera", "motionBlur"],
  ["removeStrobe", "lighting", "removeStrobe"],
  ["avatarOn", "avatar", "enabled"]
];

function syncControls() {
  const s = Settings.current;
  SLIDERS.forEach(([id, g, k, fmt]) => {
    const el = document.getElementById(id);
    el.value = s[g][k];
    const out = document.getElementById(id + "Out");
    if (out && fmt) out.textContent = fmt(s[g][k]);
    // filled track
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--fill", pct + "%");
  });
  CHECKS.forEach(([id, g, k]) => (document.getElementById(id).checked = s[g][k]));
  document.querySelectorAll('input[name="pov"]').forEach((r) => (r.checked = r.value === s.camera.pov));
  $("#povNote").hidden = s.avatar.enabled;
  document.querySelectorAll(".pov-card").forEach((c) => c.classList.toggle("disabled", !s.avatar.enabled));

  // avatar previews
  const av = avatarById(s.avatar.character);
  $("#opacityPreview").innerHTML = ghostSVG(av);
  $("#opacityPreview").style.opacity = s.avatar.opacity / 100;
  $("#charBig").innerHTML = ghostSVG(av);
  $("#charBig").style.opacity = Math.max(s.avatar.opacity, 60) / 100;
  $("#charName").textContent = av.name;
  $("#charTag").textContent = av.tagline;
  document.querySelectorAll(".char-thumb").forEach((b) => {
    const on = b.dataset.id === av.id;
    b.setAttribute("aria-checked", on);
    b.tabIndex = on ? 0 : -1;
  });
  document.querySelector(".opacity-row").classList.toggle("disabled", !s.avatar.enabled);
}

function buildControls() {
  SLIDERS.forEach(([id, g, k]) => {
    document.getElementById(id).addEventListener("input", (e) => Settings.set(g, k, Number(e.target.value)));
  });
  CHECKS.forEach(([id, g, k]) => {
    document.getElementById(id).addEventListener("change", (e) => Settings.set(g, k, e.target.checked));
  });
  document.querySelectorAll('input[name="pov"]').forEach((r) =>
    r.addEventListener("change", () => Settings.set("camera", "pov", r.value))
  );
  // − / + step buttons next to sliders
  document.querySelectorAll(".step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.for);
      const step = Number(input.step) * Number(btn.dataset.dir);
      const v = Math.min(Number(input.max), Math.max(Number(input.min), Number(input.value) + step));
      input.value = v;
      input.dispatchEvent(new Event("input"));
    });
  });

  // character select (carousel + thumbnails)
  const thumbs = $("#charThumbs");
  AVATARS.forEach((av) => {
    const b = document.createElement("button");
    b.className = "char-thumb";
    b.dataset.id = av.id;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", `${av.name}: ${av.tagline}`);
    b.innerHTML = ghostSVG(av) + `<span>${av.name}</span>`;
    b.addEventListener("click", () => Settings.set("avatar", "character", av.id));
    thumbs.appendChild(b);
  });
  const cycle = (dir) => {
    const i = AVATARS.findIndex((a) => a.id === Settings.current.avatar.character);
    const next = AVATARS[(i + dir + AVATARS.length) % AVATARS.length];
    Settings.set("avatar", "character", next.id);
  };
  $("#charPrev").addEventListener("click", () => cycle(-1));
  $("#charNext").addEventListener("click", () => cycle(1));
  thumbs.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      cycle(e.key === "ArrowRight" ? 1 : -1);
      thumbs.querySelector('[aria-checked="true"]').focus();
    }
  });

  // save tab
  $("#saveBtn").addEventListener("click", () => Settings.save());
  $("#resetBtn").addEventListener("click", () => Settings.reset());
  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(Settings.current, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "date-anything-comfort-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      Settings.current = mergeDefaults(JSON.parse(await file.text()));
      Settings.emit();
      syncControls();
      $("#saveStatus").textContent = "Imported. Press Save to keep these settings.";
      $("#saveStatus").className = "save-status";
    } catch (err) {
      $("#saveStatus").textContent = "That file isn't a valid settings file.";
      $("#saveStatus").className = "save-status err";
    }
    e.target.value = "";
  });

  // tabs (click + arrow keys, like a real tablist)
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (tab.id !== "tab-save") $("#saveBtn").classList.remove("saved");
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j]); tabs[j].focus(); }
    });
  });

  // open / close
  $("#btnSettings").addEventListener("click", () => openSettings());
  $("#settingsClose").addEventListener("click", () => closeSettings());
  $("#settingsBackdrop").addEventListener("mousedown", (e) => {
    if (e.target.id === "settingsBackdrop") closeSettings();
  });
  $("#settings").addEventListener("keydown", trapFocus);
}

let lastFocus = null;
function openSettings() {
  Settings.isOpen = true;
  lastFocus = document.activeElement;
  $("#settingsBackdrop").hidden = false;
  syncControls();
  document.querySelector('[role="tab"][aria-selected="true"]').focus();
}
function closeSettings() {
  Settings.isOpen = false;
  $("#settingsBackdrop").hidden = true;
  if (Settings.isDirty()) toast("Settings applied for now. Open Save to keep them.");
  (lastFocus || $("#btnSettings")).focus();
}
function trapFocus(e) {
  if (e.key !== "Tab") return;
  const f = [...$("#settings").querySelectorAll("button, input, [tabindex='0'], label.btn")]
    .filter((el) => !el.closest("[hidden]") && el.offsetParent !== null && el.tabIndex !== -1);
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

buildControls();
syncControls();
