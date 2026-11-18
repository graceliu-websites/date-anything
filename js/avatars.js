/* =========================================================
   AVATAR ARTWORK  (soft, rounded "vinyl toy" style)
   ghostSVG(avatar) returns an SVG string for any entry in AVATARS
   (js/data.js). Used by the in-game avatar AND the settings previews.
   Every drawing shares one 100 x 128 canvas so they swap cleanly.

   How the soft 3D look works:
   - grad(base) makes a radial gradient per colour: light top-left,
     darker edges, so every shape looks rounded.
   - Outlines are a thin, darker tint of the shape's own colour
     instead of hard black lines.
   - Blush, sheen and glow use a small blur filter.
   ========================================================= */

const SKIN = "#ffe0cc";
const EYE = "#3d2b3a";
let _avatarUid = 0;

/* lighten (p > 0) or darken (p < 0) a hex colour */
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  const t = p < 0 ? 0 : 255, a = Math.abs(p);
  const ch = (v) => Math.round((t - v) * a + v);
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function ghostSVG(av) {
  // every SVG gets its own id prefix so gradients don't clash on the page
  const ctx = { id: "av" + _avatarUid++, defs: [], grads: {} };
  const kind = av.kind || "ghost";
  const body = kind === "ghost" ? drawGhost(ctx, av) : (CHIBI[kind] || CHIBI.girl)(ctx, av);
  return `<svg viewBox="0 -6 100 128" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="${ctx.id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id="${ctx.id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>
      ${ctx.defs.join("")}
    </defs>${body}</svg>`;
}

/* ---------- shading helpers ---------- */
function grad(ctx, base) {
  if (ctx.grads[base]) return ctx.grads[base];
  const id = `${ctx.id}-g${Object.keys(ctx.grads).length}`;
  ctx.defs.push(`<radialGradient id="${id}" cx=".38" cy=".3" r=".85" fx=".34" fy=".24">
    <stop offset="0" stop-color="${shade(base, 0.45)}"/>
    <stop offset=".55" stop-color="${base}"/>
    <stop offset="1" stop-color="${shade(base, -0.2)}"/></radialGradient>`);
  return (ctx.grads[base] = `url(#${id})`);
}
/* fill + soft self-coloured edge */
const soft = (ctx, base) =>
  `fill="${grad(ctx, base)}" stroke="${shade(base, -0.38)}" stroke-width="1.3" stroke-opacity=".55" stroke-linejoin="round"`;

function checks(ctx, color) {
  const id = `${ctx.id}-chk${ctx.defs.length}`;
  ctx.defs.push(`<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="6" height="6" fill="#fff"/><rect width="3" height="3" fill="${color}"/><rect x="3" y="3" width="3" height="3" fill="${color}"/></pattern>`);
  return `url(#${id})`;
}

/* ---------- shared parts ---------- */
function face(ctx, o = {}) {
  const y = 55;
  const eye = (x) => (o.sclera ? `<ellipse cx="${x}" cy="${y}" rx="4.8" ry="5.8" fill="#fff" opacity=".9"/>` : "") +
    `<ellipse cx="${x}" cy="${y}" rx="4.1" ry="5.1" fill="${EYE}"/>
     <circle cx="${x + 1.4}" cy="${y - 1.9}" r="1.7" fill="#fff"/><circle cx="${x - 1.3}" cy="${y + 2}" r=".8" fill="#fff" opacity=".8"/>`;
  const brows = o.brows ? `<path d="M35 45.5q4-2.4 8 0M57 45.5q4-2.4 8 0" fill="none" stroke="${o.brows}" stroke-width="2.4" stroke-linecap="round"/>` : "";
  const blush = `<g filter="url(#${ctx.id}-blur)" opacity=".6"><ellipse cx="31" cy="63" rx="6" ry="3.6" fill="#ff8fab"/><ellipse cx="69" cy="63" rx="6" ry="3.6" fill="#ff8fab"/></g>`;
  const mouth = o.nose
    ? `<path d="M47 61.5q3-1.6 6 0q-.4 3-3 3.8q-2.6-.8-3-3.8z" fill="${o.nose}"/>
       <path d="M46.5 67q1.8 1.8 3.5 0q1.7 1.8 3.5 0" fill="none" stroke="${o.mouth || EYE}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M47 64q3 2.6 6 0" fill="none" stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"/>`;
  return blush + eye(39) + eye(61) + brows + mouth;
}
const headShape = (ctx, c) => `<ellipse cx="50" cy="45" rx="31" ry="29" ${soft(ctx, c)}/>`;
const sheen = (ctx) => `<ellipse cx="37" cy="27" rx="11" ry="5.5" fill="#fff" opacity=".4" filter="url(#${ctx.id}-blur)" transform="rotate(-18 37 27)"/>`;
const humanEars = (ctx) => `<ellipse cx="20" cy="50" rx="4.5" ry="5.5" ${soft(ctx, SKIN)}/><ellipse cx="80" cy="50" rx="4.5" ry="5.5" ${soft(ctx, SKIN)}/>`;
function legs(ctx, leg, shoe) {
  return `<rect x="39.5" y="96" width="9" height="16" rx="4.5" ${soft(ctx, leg)}/>
    <rect x="51.5" y="96" width="9" height="16" rx="4.5" ${soft(ctx, leg)}/>
    <ellipse cx="43.5" cy="112.5" rx="6.5" ry="4" ${soft(ctx, shoe)}/>
    <ellipse cx="56.5" cy="112.5" rx="6.5" ry="4" ${soft(ctx, shoe)}/>`;
}
function arms(ctx, sleeve, hand = sleeve) {
  return `<ellipse cx="29" cy="82" rx="5.5" ry="10.5" ${soft(ctx, sleeve)} transform="rotate(42 29 82)"/>
    <ellipse cx="71" cy="82" rx="5.5" ry="10.5" ${soft(ctx, sleeve)} transform="rotate(-42 71 82)"/>
    ${hand !== sleeve ? `<circle cx="22" cy="89" r="4.6" ${soft(ctx, hand)}/><circle cx="78" cy="89" r="4.6" ${soft(ctx, hand)}/>` : ""}`;
}
const bean = (ctx, c) => `<path d="M37 70Q50 65 63 70Q69 86 66 102Q50 108 34 102Q31 86 37 70Z" ${soft(ctx, c)}/>`;
const belly = (ctx, c) => `<ellipse cx="50" cy="89" rx="10" ry="11" fill="${grad(ctx, c)}"/>`;
const kerchief = (ctx, color) =>
  `<path d="M33 70.5Q50 77 67 70.5Q61 82 50 88Q39 82 33 70.5Z" fill="${checks(ctx, color)}" stroke="${shade(color, -0.2)}" stroke-width="1" stroke-opacity=".5" stroke-linejoin="round"/>`;
/* rounded, soft pointed ear (x = tip x, flip for the right side) */
function ear(ctx, side, fill, inner, tipY = 9) {
  const m = side === "L" ? 1 : -1, cx = (v) => 50 - m * (50 - v);
  const outer = `M${cx(24)} 40Q${cx(14)} ${tipY} ${cx(25)} ${tipY - 1}Q${cx(36)} ${tipY} ${cx(45)} 22Z`;
  const inn = `M${cx(27)} 32Q${cx(21)} ${tipY + 6} ${cx(27)} ${tipY + 5}Q${cx(33)} ${tipY + 6} ${cx(39)} 23Z`;
  return `<path d="${outer}" ${soft(ctx, fill)}/>` + (inner ? `<path d="${inn}" fill="${grad(ctx, inner)}"/>` : "");
}

/* ---------- ghosts ---------- */
function drawGhost(ctx, av) {
  const c = av.color, a = av.accent;
  const shape = "M50 9C31 9 23 27 23 50C23 72 18 88 13 104Q19 112 27 106Q34 112 42 106Q50 112 58 106Q66 112 73 106Q81 112 87 104C82 88 77 72 77 50C77 27 69 9 50 9Z";
  const extras = {
    none: "",
    bow: `<ellipse cx="42" cy="15" rx="9" ry="6.5" ${soft(ctx, a)} transform="rotate(-22 42 15)"/>
          <ellipse cx="58" cy="15" rx="9" ry="6.5" ${soft(ctx, a)} transform="rotate(22 58 15)"/><circle cx="50" cy="16" r="4.2" ${soft(ctx, a)}/>`,
    ears: `<path d="M26 32Q22 5 34 8Q41 11 45 16Z" ${soft(ctx, c)}/><path d="M74 32Q78 5 66 8Q59 11 55 16Z" ${soft(ctx, c)}/>
           <path d="M29 24Q27 12 34 14Q38 16 40 18Z" fill="${shade(a, 0.55)}"/><path d="M71 24Q73 12 66 14Q62 16 60 18Z" fill="${shade(a, 0.55)}"/>`,
    wizard: `<path d="M27 26Q40 22 50 -3Q53 -6 55 -2Q62 18 74 26Q50 33 27 26Z" ${soft(ctx, a)}/>
             <ellipse cx="50" cy="27" rx="28" ry="5.5" ${soft(ctx, shade(a, -0.1))}/><path d="M51 8l1.5 3 3 .4-2.2 2 .6 3-2.9-1.5-2.9 1.5.6-3-2.2-2 3-.4z" fill="#fff6b0"/>`
  };
  return `
    <path d="${shape}" fill="#fff" opacity=".7" filter="url(#${ctx.id}-glow)"/>
    <path d="${shape}" ${soft(ctx, c)}/>
    <ellipse cx="20" cy="68" rx="5.5" ry="9" ${soft(ctx, c)} transform="rotate(40 20 68)"/>
    <ellipse cx="80" cy="68" rx="5.5" ry="9" ${soft(ctx, c)} transform="rotate(-40 80 68)"/>
    ${extras[av.hat] || ""}
    ${sheen(ctx)}
    <g transform="translate(0 2)">${face(ctx)}</g>`;
}

/* ---------- the 8 chibis ---------- */
const CHIBI = {
  /* girl with a bow and a dress */
  girl: (ctx, a) => `
    <path d="M17 46Q15 13 50 11Q85 13 83 46Q85 67 77 75Q69 77 65 68H35Q31 77 23 75Q15 67 17 46Z" ${soft(ctx, a.hair)}/>
    ${legs(ctx, SKIN, a.accent)}
    <path d="M38 70Q50 65 62 70Q70 86 74 100Q50 108 26 100Q30 86 38 70Z" ${soft(ctx, a.outfit)}/>
    <path d="M28 99Q50 106 72 99" fill="none" stroke="#fff" stroke-width="2.6" stroke-dasharray=".1 4.4" stroke-linecap="round"/>
    ${arms(ctx, SKIN)}
    <path d="M50 70.5Q41 69 39 73.5Q43 79 50 75Q57 79 61 73.5Q59 69 50 70.5Z" fill="#fff"/>
    ${humanEars(ctx)}${headShape(ctx, SKIN)}
    <path d="M19 45Q19 15 50 14Q81 15 81 45Q74 37 66 38Q62 31 55 35Q50 29 45 35Q38 31 34 38Q26 37 19 45Z" ${soft(ctx, a.hair)}/>
    ${sheen(ctx)}
    <ellipse cx="60" cy="13" rx="9" ry="6.5" ${soft(ctx, a.accent)} transform="rotate(-24 60 13)"/>
    <ellipse cx="76" cy="17" rx="9" ry="6.5" ${soft(ctx, a.accent)} transform="rotate(26 76 17)"/>
    <circle cx="68" cy="16" r="4.3" ${soft(ctx, a.accent)}/>
    ${face(ctx, { brows: shade(a.hair, -0.1) })}`,

  /* village boy in overalls */
  boy: (ctx, a) => `
    ${legs(ctx, a.outfit, "#8a5a36")}
    ${bean(ctx, a.shirt)}
    <path d="M39 81Q50 78 61 81L64 100Q50 107 36 100Z" ${soft(ctx, a.outfit)}/>
    <path d="M40.5 81 38 70M59.5 81 62 70" stroke="${a.outfit}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="41" cy="83.5" r="1.8" fill="#ffd36e"/><circle cx="59" cy="83.5" r="1.8" fill="#ffd36e"/>
    <rect x="45" y="86" width="10" height="7" rx="2.5" fill="${shade(a.outfit, -0.12)}"/>
    ${arms(ctx, a.shirt, SKIN)}
    ${humanEars(ctx)}${headShape(ctx, SKIN)}
    <path d="M19 46Q17 13 50 12Q83 13 81 46Q77 35 70 35Q68 27 60 30Q56 22 50 28Q44 22 40 30Q32 27 30 35Q23 35 19 46Z" ${soft(ctx, a.hair)}/>
    ${sheen(ctx)}
    ${face(ctx, { brows: shade(a.hair, -0.1) })}`,

  /* fairy girl (original design) */
  fairy: (ctx, a) => `
    <g opacity=".8">
      <ellipse cx="19" cy="62" rx="11" ry="21" ${soft(ctx, a.wings)} transform="rotate(-55 19 62)"/>
      <ellipse cx="81" cy="62" rx="11" ry="21" ${soft(ctx, a.wings)} transform="rotate(55 81 62)"/>
      <ellipse cx="20" cy="88" rx="7.5" ry="13" ${soft(ctx, a.wings)} transform="rotate(-125 20 88)"/>
      <ellipse cx="80" cy="88" rx="7.5" ry="13" ${soft(ctx, a.wings)} transform="rotate(125 80 88)"/>
    </g>
    <path d="M17 46Q15 13 50 11Q85 13 83 46Q87 70 79 84Q72 80 70 72H30Q28 80 21 84Q13 70 17 46Z" ${soft(ctx, a.hair)}/>
    <circle cx="21" cy="83" r="6" ${soft(ctx, a.hair)}/><circle cx="79" cy="83" r="6" ${soft(ctx, a.hair)}/>
    ${legs(ctx, SKIN, shade(a.outfit, -0.1))}
    <path d="M38 70Q50 65 62 70Q66 80 72 92Q66 99 60 94Q56 102 50 96Q44 102 40 94Q34 99 28 92Q34 80 38 70Z" ${soft(ctx, a.outfit)}/>
    ${arms(ctx, SKIN)}
    ${humanEars(ctx)}${headShape(ctx, SKIN)}
    <path d="M19 44Q21 15 50 14Q79 15 81 44Q71 30 53 32Q41 33 35 40Q27 36 19 44Z" ${soft(ctx, a.hair)}/>
    ${sheen(ctx)}
    ${[[27, 24, "#ffb8cf"], [37, 16, "#fff4d6"], [50, 13, "#ffc9a8"], [63, 16, "#fff4d6"], [73, 24, "#ffb8cf"]]
      .map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((r) =>
        `<ellipse cy="-3.3" rx="2.6" ry="3.3" fill="${grad(ctx, c)}" transform="rotate(${r})"/>`).join("")}<circle r="1.6" fill="#ffd56b"/></g>`).join("")}
    <path d="M8 40l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1zM91 52l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM86 100l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#fff6b8"/>
    ${face(ctx, { brows: shade(a.hair, -0.2) })}`,

  /* elf boy (original design) */
  elf: (ctx, a) => `
    ${legs(ctx, "#a07c5a", "#6e4a2e")}
    ${bean(ctx, a.outfit)}
    <rect x="34" y="88" width="32" height="4.5" rx="2" fill="#7a5232"/><rect x="46.5" y="87" width="7" height="6.5" rx="2" fill="#ffd36e"/>
    ${arms(ctx, a.outfit, SKIN)}
    ${[-14, 0, 14].map((r, i) => `<ellipse cx="${43 + i * 7}" cy="72" rx="5" ry="3.6" fill="${grad(ctx, shade(a.outfit, -0.12))}" transform="rotate(${r} ${43 + i * 7} 72)"/>`).join("")}
    <path d="M23 42Q9 29 6 33Q8 46 24 55Z" ${soft(ctx, SKIN)}/><path d="M77 42Q91 29 94 33Q92 46 76 55Z" ${soft(ctx, SKIN)}/>
    ${headShape(ctx, SKIN)}
    <path d="M20 44Q22 22 50 21Q78 22 80 44Q72 36 62 38Q56 31 50 36Q44 31 38 38Q28 36 20 44Z" ${soft(ctx, a.hair)}/>
    <path d="M19 36Q20 9 50 7Q73 7 82 20Q92 19 96 30Q93 37 85 32Q82 34 81 36Q50 26 19 36Z" ${soft(ctx, a.outfit)}/>
    <path d="M19 36Q50 26 81 36" fill="none" stroke="${shade(a.outfit, -0.25)}" stroke-width="2" stroke-linecap="round" opacity=".6"/>
    <circle cx="95" cy="31" r="4.5" ${soft(ctx, "#fff3d6")}/>
    ${sheen(ctx)}
    ${face(ctx, { brows: shade(a.hair, -0.15) })}`,

  /* corgi */
  corgi: (ctx, a) => `
    ${legs(ctx, a.fur, "#fffaf4")}
    ${bean(ctx, a.fur)}${belly(ctx, "#fffaf4")}
    ${arms(ctx, a.fur)}
    ${kerchief(ctx, "#7fb2ff")}
    ${ear(ctx, "L", a.fur, "#ffc8b8")}${ear(ctx, "R", a.fur, "#ffc8b8")}
    ${headShape(ctx, a.fur)}
    <path d="M50 30Q45 46 30 57Q32 73 50 74Q68 73 70 57Q55 46 50 30Z" fill="${grad(ctx, "#fffaf4")}"/>
    ${sheen(ctx)}
    ${face(ctx, { nose: "#6b4632", brows: shade(a.fur, -0.3) })}`,

  /* cat */
  cat: (ctx, a) => `
    <path d="M63 99Q90 101 84 72Q83 66 78 68" fill="none" stroke="${shade(a.fur, -0.12)}" stroke-width="7.5" stroke-linecap="round"/>
    ${legs(ctx, a.fur, "#fbf8ff")}
    ${bean(ctx, a.fur)}${belly(ctx, "#f6f2ff")}
    ${arms(ctx, a.fur)}
    <path d="M35 71Q50 77 65 71" fill="none" stroke="#ff8fab" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="50" cy="77.5" r="3.6" ${soft(ctx, "#ffd36e")}/>
    ${ear(ctx, "L", a.fur, "#ffc4d6", 13)}${ear(ctx, "R", a.fur, "#ffc4d6", 13)}
    ${headShape(ctx, a.fur)}
    <path d="M44 20q.5 4 1 7M50 18.5v8M56 20q-.5 4-1 7" stroke="${shade(a.fur, -0.2)}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="50" cy="66" rx="10" ry="7" fill="${grad(ctx, "#f6f2ff")}"/>
    <path d="M27 61l-9-1.5M27 65l-9 1.5M73 61l9-1.5M73 65l9 1.5" stroke="${shade(a.fur, -0.3)}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
    ${sheen(ctx)}
    ${face(ctx, { nose: "#ff8fab" })}`,

  /* black rabbit */
  rabbit: (ctx, a) => `
    <circle cx="65" cy="99" r="7" ${soft(ctx, "#ffffff")}/>
    ${legs(ctx, a.fur, shade(a.fur, 0.18))}
    ${bean(ctx, a.fur)}${belly(ctx, shade(a.fur, 0.2))}
    ${arms(ctx, a.fur)}
    ${kerchief(ctx, "#c3a6ff")}
    <ellipse cx="38" cy="9" rx="8.5" ry="20" ${soft(ctx, a.fur)} transform="rotate(-10 38 9)"/>
    <ellipse cx="62" cy="9" rx="8.5" ry="20" ${soft(ctx, a.fur)} transform="rotate(10 62 9)"/>
    <ellipse cx="38" cy="11" rx="4.2" ry="14" fill="${grad(ctx, "#ffadc6")}" transform="rotate(-10 38 11)"/>
    <ellipse cx="62" cy="11" rx="4.2" ry="14" fill="${grad(ctx, "#ffadc6")}" transform="rotate(10 62 11)"/>
    ${headShape(ctx, a.fur)}
    <g filter="url(#${ctx.id}-blur)" opacity=".55"><ellipse cx="39" cy="55" rx="8" ry="8.5" fill="${shade(a.fur, 0.35)}"/><ellipse cx="61" cy="55" rx="8" ry="8.5" fill="${shade(a.fur, 0.35)}"/></g>
    <ellipse cx="50" cy="66" rx="11" ry="7.5" fill="${grad(ctx, shade(a.fur, 0.22))}"/>
    ${sheen(ctx)}
    ${face(ctx, { sclera: true, nose: "#ffadc6", mouth: "#f4eefc" })}`,

  /* panda */
  panda: (ctx, a) => `
    ${legs(ctx, a.fur, a.fur)}
    ${bean(ctx, "#ffffff")}
    ${arms(ctx, a.fur)}
    ${kerchief(ctx, "#8fd6a8")}
    <circle cx="25" cy="22" r="9.5" ${soft(ctx, a.fur)}/><circle cx="75" cy="22" r="9.5" ${soft(ctx, a.fur)}/>
    ${headShape(ctx, "#ffffff")}
    <ellipse cx="38" cy="55" rx="8" ry="10.5" fill="${grad(ctx, a.fur)}" transform="rotate(28 38 55)"/>
    <ellipse cx="62" cy="55" rx="8" ry="10.5" fill="${grad(ctx, a.fur)}" transform="rotate(-28 62 55)"/>
    ${sheen(ctx)}
    ${face(ctx, { sclera: true, nose: a.fur })}`
};
