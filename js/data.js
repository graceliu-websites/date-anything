/* =========================================================
   GAME DATA  (JSON-shaped on purpose)
   ---------------------------------------------------------
   Everything in here is plain JSON. It lives in a .js file so the
   game runs by double-clicking index.html (browsers block fetch()
   of local .json files on file://). If you serve the project with
   a local server (e.g. VS Code "Live Server"), you can move each
   object into its own .json file and load it with fetch().
   ========================================================= */

/* Default accessibility settings. "Reset to defaults" goes back to these.
   Defaults lean comfortable: steady cam ON, motion blur OFF, strobe removed. */
const DEFAULT_SETTINGS = {
  "version": 1,
  "camera": {
    "speed": 4,            // 1 (slow) – 10 (fast): turning speed + how quickly the camera follows
    "pov": "center",       // "left" shoulder | "center" (top of head) | "right" shoulder
    "height": 0,           // -100 (lower) – 100 (higher) offset
    "distance": 260,       // 140 (close) – 420 (far) behind the avatar
    "zoom": 100,           // 70 (wide) – 140 (zoomed in), percent
    "steadyCam": true,     // no head-bob, extra smoothing
    "motionBlur": false    // blur while moving
  },
  "avatar": {
    "enabled": true,       // false = classic first-person view
    "opacity": 50,         // 20 – 100 percent
    "character": "sheet"   // id from AVATARS below
  },
  "lighting": {
    "brightness": 100,     // 50 (dim) – 150 (bright), percent
    "removeStrobe": true   // replace flashing effects with a slow, steady glow
  }
};

/* Ghost avatars you can pick (Subway-Surfers-style character select).
   Original placeholder designs – swap in your team's art any time. */
const AVATARS = [
  { "id": "sheet",  "name": "Boo",      "tagline": "The classic bedsheet.",     "color": "#f4f1ff", "accent": "#9b8cff", "hat": "none" },
  { "id": "bow",    "name": "Bijou",    "tagline": "Never haunts without a bow.", "color": "#ffe3ef", "accent": "#ff5c9a", "hat": "bow" },
  { "id": "kitty",  "name": "Mochi",    "tagline": "Part ghost, part cat.",     "color": "#e3f6ff", "accent": "#3fa9f5", "hat": "ears" },
  { "id": "wizard", "name": "Wisp",     "tagline": "Studied at spook school.",  "color": "#e9ffe6", "accent": "#3dbb6a", "hat": "wizard" }
];

/* Dateable objects in the room. x/z are floor positions (room is 1400 x 1400,
   centre is 0,0). "kind" chooses how the object is drawn in game.js. */
const DATEABLES = [
  {
    "id": "fridge", "name": "Chilly", "kind": "fridge", "x": -560, "z": -520, "w": 150, "d": 110, "h": 330,
    "color": "#cfe7f2",
    "intro": "Oh! A visitor. Sorry if I'm a little cold at first. It's sort of my whole thing.",
    "choices": [
      { "text": "I like to keep things cool too.", "reply": "Finally, someone who gets it. Stick around… like a magnet.", "love": 1 },
      { "text": "Got any snacks in there?",        "reply": "Wow. Straight for the crisper drawer. Rude.",              "love": -1 }
    ]
  },
  {
    "id": "clock", "name": "Tock", "kind": "clock", "x": 120, "z": -690, "w": 120, "d": 20, "h": 120, "y": -260,
    "color": "#ffd89a",
    "intro": "You're late. Well, everyone's late, technically. I'm always exactly on time.",
    "choices": [
      { "text": "I made time for you.",       "reply": "…Nobody has ever said that to me. My hands are shaking.", "love": 1 },
      { "text": "Are you running fast?",      "reply": "I'll have you know I'm accurate to the second.",         "love": -1 }
    ]
  },
  {
    "id": "lamp", "name": "Lux", "kind": "lamp", "x": 520, "z": -380, "w": 70, "d": 70, "h": 260,
    "color": "#ffe27a", "party": true,
    "intro": "Hiii! Want to see my party mode? I've been practising!",
    "choices": [
      { "text": "Show me your party mode!", "reply": "LIGHTS… ON!", "love": 1, "effect": "strobe" },
      { "text": "Maybe something calmer?",  "reply": "Aw, okay. Cozy reading glow it is.", "love": 1 }
    ]
  },
  {
    "id": "box", "name": "Boxley", "kind": "box", "x": -420, "z": 260, "w": 120, "d": 120, "h": 110,
    "color": "#c79a63",
    "intro": "Don't mind me. I'm just… unpacking my feelings.",
    "choices": [
      { "text": "Want help unpacking?",       "reply": "That's the nicest thing anyone's offered. Careful, I'm fragile.", "love": 1 },
      { "text": "Can I put stuff in you?",    "reply": "We JUST met.", "love": -1 }
    ]
  },
  {
    "id": "couch", "name": "Cushla", "kind": "couch", "x": 330, "z": 380, "w": 340, "d": 130, "h": 120,
    "color": "#b07ad6",
    "intro": "Sit down, babe. Stay a while. Stay forever, honestly.",
    "choices": [
      { "text": "Don't mind if I do.",        "reply": "Mmm. You're a good sitter. I can tell.", "love": 1 },
      { "text": "I'm more of a standing person.", "reply": "Ugh. Fine. My cushions are wounded.", "love": -1 }
    ]
  },
  {
    "id": "door", "name": "Hinge", "kind": "door", "x": -120, "z": 690, "w": 160, "d": 20, "h": 300, "wall": "south",
    "color": "#8a5a3b",
    "intro": "Coming or going? I swing both ways, you know. Door joke.",
    "choices": [
      { "text": "Coming. Definitely coming in.", "reply": "Then let me open up to you.", "love": 1 },
      { "text": "Going, actually.",              "reply": "Don't let me hit you on the way out.", "love": -1 }
    ]
  }
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
