/* =========================================================
   GAME: a CSS-3D room you walk around in, with dateable objects.
   No libraries. The "camera" works by moving the whole #world
   the opposite way, inside a perspective container.
   ========================================================= */

const ROOM = 1400;          // floor is ROOM x ROOM, centred on 0,0
const HALF = ROOM / 2;
const WALL_H = 520;
const PLAYER_R = 45;
const MOVE_SPEED = 260;     // px per second (kept gentle on purpose)
const TALK_RANGE = 280;
const DEG = 180 / Math.PI;

const world = document.getElementById("world");
const viewport = document.getElementById("viewport");
const lightFx = document.getElementById("lightFx");

/* ---------- game state ---------- */
const state = {
  player: { x: 0, z: 330, yaw: 0 },
  cam: { x: 0, y: -260, z: 600, yaw: 0, pitch: 0 },
  keys: new Set(),
  specs: false,
  dayIndex: 3,               // Thursday, like the wireframe
  hearts: 5,                 // conversations left today
  maxHearts: 5,
  talkedToday: new Set(),
  love: {},                  // id -> score
  met: new Set(),
  inDialogue: false,
  walkPhase: 0,
  moving: false,
  target: null,
  t: 0
};
DATEABLES.forEach((d) => (state.love[d.id] = 0));

/* ---------- building blocks ---------- */
function el(cls, parent = world, html = "") {
  const e = document.createElement("div");
  e.className = "p " + cls;
  if (html) e.innerHTML = html;
  parent.appendChild(e);
  return e;
}
/* Put an element's CENTRE at x,y,z (y is up-negative), then rotate it */
function place(e, x, y, z, w, h, ry = 0, rx = 0) {
  e.style.width = w + "px";
  e.style.height = h + "px";
  e.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
}
/* A 5-sided box (no bottom). yBottom = where it sits (0 = floor). */
function box(x, z, w, h, d, color, cls = "", yBottom = 0) {
  const cy = yBottom - h / 2;
  const g = { front: el(`face front ${cls}`), back: el(`face back ${cls}`), left: el(`face side ${cls}`),
              right: el(`face side ${cls}`), top: el(`face top ${cls}`) };
  place(g.front, x, cy, z + d / 2, w, h, 0);
  place(g.back, x, cy, z - d / 2, w, h, 180);
  place(g.left, x - w / 2, cy, z, d, h, -90);
  place(g.right, x + w / 2, cy, z, d, h, 90);
  place(g.top, x, cy - h / 2, z, w, d, 0, 90);
  Object.values(g).forEach((f) => (f.style.backgroundColor = color));
  return g;
}
const EYES = `<div class="eyes"><i></i><i></i><b></b></div>`;

/* ---------- build the room ---------- */
function buildRoom() {
  place(el("floor"), 0, 0, 0, ROOM, ROOM, 0, 90);
  place(el("ceiling"), 0, -WALL_H, 0, ROOM, ROOM, 0, -90);
  place(el("wall north"), 0, -WALL_H / 2, -HALF, ROOM, WALL_H, 0);
  place(el("wall south"), 0, -WALL_H / 2, HALF, ROOM, WALL_H, 180);
  place(el("wall west"), -HALF, -WALL_H / 2, 0, ROOM, WALL_H, 90);
  place(el("wall east"), HALF, -WALL_H / 2, 0, ROOM, WALL_H, -90);

  // decor
  place(el("rug"), 60, -1, 120, 620, 420, 0, 90);
  place(el("room-window"), -HALF + 2, -280, -120, 300, 200, 90);
  place(el("frame"), HALF - 2, -290, 120, 180, 130, -90);
  place(el("shelf"), -380, -300, -HALF + 14, 260, 16, 0);
  box(-440, -HALF + 30, 50, 50, 40, "#e8d4ff", "", -308);
  box(-340, -HALF + 30, 30, 70, 30, "#9fe0c2", "", -308);
  place(el("ceiling-light"), 0, -WALL_H + 2, 0, 260, 260, 0, -90);

  // dateables
  DATEABLES.forEach((d) => {
    const c = d.color;
    let front;
    if (d.kind === "fridge") {
      const g = box(d.x, d.z, d.w, d.h, d.d, c, "fridge");
      front = g.front;
      front.innerHTML = `<div class="fridge-line"></div><div class="handle h1"></div><div class="handle h2"></div>`;
    } else if (d.kind === "box") {
      const g = box(d.x, d.z, d.w, d.h, d.d, c, "crate");
      front = g.front;
      g.top.innerHTML = `<div class="tape"></div>`;
    } else if (d.kind === "couch") {
      const seat = box(d.x, d.z, d.w, 60, d.d, c, "cushion");
      box(d.x, d.z - d.d / 2 + 18, d.w, d.h, 36, c, "cushion dark");
      box(d.x - d.w / 2 + 20, d.z, 40, 90, d.d, c, "cushion dark");
      box(d.x + d.w / 2 - 20, d.z, 40, 90, d.d, c, "cushion dark");
      front = seat.front;
    } else if (d.kind === "lamp") {
      box(d.x, d.z, 80, 14, 80, "#5b4a6b");
      box(d.x, d.z, 12, d.h - 70, 12, "#5b4a6b", "", -14);
      const shade = box(d.x, d.z, 100, 80, 100, c, "shade", -(d.h - 80));
      front = shade.front;
      world.querySelectorAll(".shade").forEach((s) => s.classList.add("lamp-" + d.id));
    } else if (d.kind === "clock") {
      front = el("clock");
      place(front, d.x, d.y, d.z, d.w, d.h, 0);
      front.innerHTML = `<div class="hand hr"></div><div class="hand mn"></div>`;
    } else if (d.kind === "door") {
      front = el("door");
      place(front, d.x, -d.h / 2, d.z, d.w, d.h, 180);
      front.innerHTML = `<div class="knob"></div><div class="door-panel"></div><div class="door-panel low"></div>`;
    }
    front.style.backgroundColor = c;
    front.insertAdjacentHTML("beforeend", EYES);
    front.classList.add("dateable-face");

    // name tag that floats above, visible with Date Specs on
    const tag = el("tag");
    tag.innerHTML = `<span class="tag-heart">♥</span>${d.name}`;
    const topY = d.kind === "clock" ? d.y - d.h / 2 - 40 : -d.h - 50;
    d._tag = { el: tag, x: d.x, y: topY, z: d.kind === "door" ? d.z - 40 : d.kind === "clock" ? d.z + 30 : d.z };
  });

  // the player's ghost + its floor shadow
  state.ghost = el("ghost");
  state.shadow = el("ghost-shadow");
}

/* ---------- input ---------- */
const KEYMAP = {
  KeyW: "fwd", ArrowUp: "fwd", KeyS: "back", ArrowDown: "back",
  KeyA: "left", KeyD: "right", ArrowLeft: "turnL", ArrowRight: "turnR", KeyQ: "turnL"
};
window.addEventListener("keydown", (e) => {
  if (Settings.isOpen) {
    if (e.key === "Escape") closeSettings();
    return;
  }
  if (!document.getElementById("relBackdrop").hidden) {
    if (e.key === "Escape" || e.key === "r" || e.key === "R") closeRel();
    return;
  }
  if (e.key === "Escape") { e.preventDefault(); return state.inDialogue ? endDialogue() : openSettings(); }
  if (state.inDialogue) {
    const n = Number(e.key);
    const btns = document.querySelectorAll("#dlgChoices button");
    if (n >= 1 && n <= btns.length) btns[n - 1].click();
    return;
  }
  if (KEYMAP[e.code]) { state.keys.add(KEYMAP[e.code]); e.preventDefault(); }
  if (e.code === "KeyE" || e.code === "Space") { e.preventDefault(); interact(); }
  if (e.code === "KeyG") toggleSpecs();
  if (e.code === "KeyR") openRel();
});
window.addEventListener("keyup", (e) => KEYMAP[e.code] && state.keys.delete(KEYMAP[e.code]));
window.addEventListener("blur", () => state.keys.clear());

/* ---------- movement + collisions ---------- */
function blocked(x, z) {
  if (Math.abs(x) > HALF - PLAYER_R || Math.abs(z) > HALF - PLAYER_R) return true;
  return DATEABLES.some((d) => {
    if (d.kind === "clock" || d.kind === "door") return false;
    const hw = (d.kind === "lamp" ? 50 : d.w / 2) + PLAYER_R;
    const hd = (d.kind === "lamp" ? 50 : d.d / 2) + PLAYER_R;
    return Math.abs(x - d.x) < hw && Math.abs(z - d.z) < hd;
  });
}
function updatePlayer(dt) {
  const c = Settings.current.camera;
  const turnSpeed = (30 + c.speed * 14) / DEG;          // speed 1 → 44°/s, 10 → 170°/s
  const p = state.player, k = state.keys;
  if (k.has("turnL")) p.yaw -= turnSpeed * dt;
  if (k.has("turnR")) p.yaw += turnSpeed * dt;

  let f = 0, s = 0;
  if (k.has("fwd")) f += 1;
  if (k.has("back")) f -= 1;
  if (k.has("right")) s += 1;
  if (k.has("left")) s -= 1;
  state.moving = !!(f || s);
  if (!state.moving) return;
  const len = Math.hypot(f, s);
  const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
  const dx = ((sin * f + cos * s) / len) * MOVE_SPEED * dt;
  const dz = ((-cos * f + sin * s) / len) * MOVE_SPEED * dt;
  if (!blocked(p.x + dx, p.z)) p.x += dx;
  if (!blocked(p.x, p.z + dz)) p.z += dz;
  state.walkPhase += dt * 9;
}

/* ---------- camera ---------- */
const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
let prevCam = null;
function updateCamera(dt) {
  const S = Settings.current, c = S.camera, p = state.player, cam = state.cam;
  // how quickly the camera catches up: slower speed + steady cam = calmer
  let rate = 1.5 + c.speed * 0.9;
  if (c.steadyCam) rate *= 0.6;
  const k = 1 - Math.exp(-rate * dt);

  cam.yaw = lerpAngle(cam.yaw, p.yaw, k);
  const sin = Math.sin(cam.yaw), cos = Math.cos(cam.yaw);

  let tx, ty, tz, lookY, lookAhead;
  if (S.avatar.enabled) {
    // third person: behind the ghost, offset to a shoulder or raised above the head
    const shoulder = c.pov === "left" ? -75 : c.pov === "right" ? 75 : 0;
    const baseH = c.pov === "center" ? 300 : 200;
    const h = baseH + c.height;
    tx = p.x - sin * c.distance + cos * shoulder;
    tz = p.z + cos * c.distance + sin * shoulder;
    ty = -h;
    lookY = -120;
    lookAhead = c.distance + 160;
  } else {
    // first person (like the original game)
    tx = p.x; tz = p.z;
    ty = -(165 + c.height * 0.6);
    lookY = ty + 12;
    lookAhead = 400;
  }
  // keep the camera inside the room so it never clips through a wall
  const lim = HALF - 25;
  tx = Math.max(-lim, Math.min(lim, tx));
  tz = Math.max(-lim, Math.min(lim, tz));

  cam.x = lerp(cam.x, tx, k);
  cam.z = lerp(cam.z, tz, k);
  cam.y = lerp(cam.y, ty, k);
  const targetPitch = Math.atan2(-(lookY - cam.y), lookAhead);
  cam.pitch = lerp(cam.pitch, targetPitch, k);

  // head-bob only when steady cam is OFF
  let bob = 0;
  if (!c.steadyCam && state.moving) bob = Math.sin(state.walkPhase) * 7;

  const P = 800 * (c.zoom / 100);
  viewport.style.perspective = P + "px";
  world.style.transform =
    `translateZ(${P}px) rotateX(${cam.pitch * DEG}deg) rotateY(${cam.yaw * DEG}deg) ` +
    `translate3d(${-cam.x}px, ${-(cam.y + bob)}px, ${-cam.z}px)`;

  // motion blur (optional): based on how fast the view is changing
  let blur = 0;
  if (c.motionBlur && prevCam && dt > 0) {
    const v = Math.hypot(cam.x - prevCam.x, cam.z - prevCam.z) / dt;
    const w = Math.abs(lerpAngle(prevCam.yaw, cam.yaw, 1) - prevCam.yaw) / dt;
    blur = Math.min(4, v / 110 + w * 2.2);
  }
  prevCam = { x: cam.x, z: cam.z, yaw: cam.yaw };
  const b = S.lighting.brightness / 100;
  viewport.style.filter = `brightness(${b})${blur > 0.15 ? ` blur(${blur.toFixed(2)}px)` : ""}`;
  lightFx.style.filter = `brightness(${b})`;
}

/* ---------- billboards (ghost + name tags always face the camera) ---------- */
function updateBillboards() {
  const S = Settings.current, p = state.player;
  const yawDeg = state.cam.yaw * DEG;
  const g = state.ghost;
  g.hidden = state.shadow.hidden = !S.avatar.enabled;
  if (S.avatar.enabled) {
    const float = Math.sin(state.t * 2.2) * 6;
    const lean = state.moving ? 4 : 0;
    g.style.opacity = S.avatar.opacity / 100;
    g.style.width = "110px"; g.style.height = "140px";
    g.style.transform =
      `translate3d(${p.x - 55}px, ${-100 + float - 70}px, ${p.z}px) rotateY(${-yawDeg}deg) rotateZ(${lean}deg)`;
    place(state.shadow, p.x, -1, p.z, 90, 50, 0, 90);
    state.shadow.style.opacity = (S.avatar.opacity / 100) * 0.6;
  }
  DATEABLES.forEach((d) => {
    const t = d._tag;
    t.el.style.transform = `translate3d(${t.x}px, ${t.y}px, ${t.z}px) translate(-50%, -50%) rotateY(${-yawDeg}deg)`;
  });
}
function setGhostLook() {
  state.ghost.innerHTML = ghostSVG(avatarById(Settings.current.avatar.character));
}

/* ---------- interaction ---------- */
function findTarget() {
  const p = state.player;
  const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
  let best = null, bestD = Infinity;
  DATEABLES.forEach((d) => {
    const dx = d.x - p.x, dz = d.z - p.z;
    const dist = Math.hypot(dx, dz) - Math.max(d.w, d.d) / 2;
    if (dist > TALK_RANGE) return;
    const dot = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1);
    if (dot < 0.55) return; // roughly in front of you
    if (dist < bestD) { bestD = dist; best = d; }
  });
  return best;
}
function updatePrompt() {
  const prompt = document.getElementById("prompt");
  if (state.inDialogue || Settings.isOpen) { prompt.classList.remove("show"); return; }
  const t = findTarget();
  if (t !== state.target) {
    state.target = t;
    DATEABLES.forEach((d) => d._tag.el.classList.toggle("focus", d === t));
  }
  if (!t) { prompt.classList.remove("show"); return; }
  let msg;
  if (!state.specs) msg = `<kbd>E</kbd> Inspect the ${t.kind}`;
  else if (state.talkedToday.has(t.id)) msg = `${t.name} needs some space until tomorrow`;
  else if (state.hearts <= 0) msg = `Out of hearts today. Use the door button to end the day`;
  else msg = `<kbd>E</kbd> Talk to ${t.name}`;
  prompt.innerHTML = msg;
  prompt.classList.add("show");
}

function interact() {
  const t = findTarget();
  if (!t) return toast("Walk up to something and face it first.");
  if (!state.specs) {
    return toast(`Just a regular ${t.kind}… or is it? Press G to put on your Date Specs.`);
  }
  if (state.talkedToday.has(t.id)) return toast(`${t.name} already talked with you today.`);
  if (state.hearts <= 0) return toast("You're out of hearts today. End the day with the door button.");
  startDialogue(t);
}

const dlg = document.getElementById("dialogue");
function startDialogue(d) {
  state.inDialogue = true;
  state.keys.clear();
  state.hearts--;
  state.talkedToday.add(d.id);
  state.met.add(d.id);
  renderHearts();
  dlg.hidden = false;
  dlg.style.setProperty("--accent", d.color);
  document.getElementById("dlgName").textContent = d.name;
  document.getElementById("dlgText").textContent = d.intro;
  const box = document.getElementById("dlgChoices");
  box.innerHTML = "";
  d.choices.forEach((ch, i) => {
    const b = document.createElement("button");
    b.innerHTML = `<kbd>${i + 1}</kbd> ${ch.text}`;
    b.addEventListener("click", () => choose(d, ch));
    box.appendChild(b);
  });
  box.querySelector("button").focus();
}
function choose(d, ch) {
  state.love[d.id] += ch.love;
  document.getElementById("dlgText").textContent = ch.reply;
  if (ch.effect === "strobe") partyLights();
  if (ch.love > 0) popHeart();
  const box = document.getElementById("dlgChoices");
  box.innerHTML = "";
  const b = document.createElement("button");
  b.innerHTML = "Continue ▸";
  b.addEventListener("click", endDialogue);
  box.appendChild(b);
  b.focus();
}
function endDialogue() {
  state.inDialogue = false;
  dlg.hidden = true;
  document.getElementById("game").focus();
}
function popHeart() {
  const h = document.createElement("div");
  h.className = "pop-heart";
  h.textContent = "♥";
  document.getElementById("game").appendChild(h);
  setTimeout(() => h.remove(), 1400);
}

/* ---------- lighting effects ----------
   Strobe allowed → flashing party lights, kept at ≤ 3 flashes per second
   (WCAG 2.3.1 threshold). Strobe removed → one slow, soft colour glow. */
let fxTimer;
function partyLights() {
  const safe = Settings.current.lighting.removeStrobe;
  lightFx.className = "";
  void lightFx.offsetWidth; // restart animation
  lightFx.className = safe ? "glow" : "strobe";
  world.classList.toggle("party", !safe);
  world.classList.toggle("party-safe", safe);
  clearTimeout(fxTimer);
  fxTimer = setTimeout(() => {
    lightFx.className = "";
    world.classList.remove("party", "party-safe");
  }, safe ? 4200 : 3000);
}
document.getElementById("testLight").addEventListener("click", partyLights);

/* ---------- HUD ---------- */
function renderHearts() {
  const row = document.getElementById("heartRow");
  row.innerHTML = "";
  for (let i = 0; i < state.maxHearts; i++) {
    const s = document.createElement("span");
    s.textContent = i < state.hearts ? "♥" : "♡";
    s.className = i < state.hearts ? "full" : "";
    row.appendChild(s);
  }
  row.setAttribute("aria-label", `${state.hearts} of ${state.maxHearts} hearts left today`);
}
function toggleSpecs() {
  state.specs = !state.specs;
  document.body.classList.toggle("specs-on", state.specs);
  const b = document.getElementById("btnSpecs");
  b.setAttribute("aria-pressed", state.specs);
  b.setAttribute("aria-label", (state.specs ? "Take off" : "Put on") + " Date Specs (G)");
  toast(state.specs ? "Date Specs on. Everything has a personality now." : "Date Specs off.");
}
function endDay() {
  state.dayIndex = (state.dayIndex + 1) % DAYS.length;
  state.hearts = state.maxHearts;
  state.talkedToday.clear();
  document.getElementById("dayName").textContent = DAYS[state.dayIndex];
  renderHearts();
  toast(`Good morning! It's ${DAYS[state.dayIndex]}. Your hearts are refilled.`);
}

function openRel() {
  const list = document.getElementById("relList");
  list.innerHTML = "";
  DATEABLES.forEach((d) => {
    const met = state.met.has(d.id), l = state.love[d.id];
    const status = !met ? "Not met yet" : l >= 2 ? "Crush 💕" : l >= 1 ? "Friendly" : l < 0 ? "Awkward" : "Acquaintance";
    const li = document.createElement("li");
    li.innerHTML = `<span class="dot" style="background:${d.color}"></span>
      <b>${met ? d.name : "???"}</b> <small>the ${d.kind}</small><span class="status">${status}</span>`;
    list.appendChild(li);
  });
  document.getElementById("relBackdrop").hidden = false;
  document.getElementById("relClose").focus();
}
function closeRel() {
  document.getElementById("relBackdrop").hidden = true;
  document.getElementById("btnHearts").focus();
}

document.getElementById("btnSpecs").addEventListener("click", toggleSpecs);
document.getElementById("btnDoor").addEventListener("click", endDay);
document.getElementById("btnInspect").addEventListener("click", interact);
document.getElementById("btnHearts").addEventListener("click", openRel);
document.getElementById("relClose").addEventListener("click", closeRel);
document.getElementById("relBackdrop").addEventListener("mousedown", (e) => e.target.id === "relBackdrop" && closeRel());
document.getElementById("helpClose").addEventListener("click", () => (document.getElementById("help").hidden = true));

/* ---------- settings → game ---------- */
Settings.onChange(() => setGhostLook());

/* ---------- main loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.t += dt;
  const paused = Settings.isOpen || state.inDialogue || !document.getElementById("relBackdrop").hidden;
  if (!paused) updatePlayer(dt);
  else state.moving = false;
  updateCamera(dt);      // keeps running while paused so setting changes preview live
  updateBillboards();
  updatePrompt();
  requestAnimationFrame(frame);
}

buildRoom();
setGhostLook();
renderHearts();
document.getElementById("game").tabIndex = -1;
// start the camera already in place (no swoop-in on load)
(() => { const s = Settings.current; updateCamera(10); })();
requestAnimationFrame(frame);
