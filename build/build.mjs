// Builds one week of morning training: branded PDF playbook, social graphics, and Google Doc HTML.
// Usage: node build.mjs <week-id>   (e.g. node build.mjs 2026-09-28)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const weekId = process.argv[2];
if (!weekId) { console.error('usage: node build.mjs <week-id>'); process.exit(1); }

const weekDir = path.join(root, 'weeks', weekId);
const outDir = path.join(weekDir, 'out');
fs.mkdirSync(outDir, { recursive: true });
const W = JSON.parse(fs.readFileSync(path.join(weekDir, 'week.json'), 'utf8'));
const F = JSON.parse(fs.readFileSync(path.join(root, 'framework', 'framework.json'), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fontUrl = (pkg, file) => pathToFileURL(path.join(here, 'node_modules/@fontsource', pkg, 'files', file)).href;

// ---- Brand: real logo files in /brand win; otherwise a drawn crown + type wordmark ----
const brandFile = name => {
  for (const ext of ['png', 'svg', 'jpg', 'webp']) {
    const p = path.join(root, 'brand', `${name}.${ext}`);
    if (fs.existsSync(p)) return pathToFileURL(p).href;
  }
  return null;
};
const LOGO_MARK = brandFile('logo-mark');
const LOGO_WORDMARK = brandFile('logo-wordmark');

let crownId = 0;
function crownSvg(size) {
  const id = `chrome${crownId++}`;
  return `<svg width="${size}" height="${size * 0.78}" viewBox="0 0 120 94" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".38" stop-color="#d4d6da"/>
    <stop offset=".52" stop-color="#7f838a"/><stop offset=".68" stop-color="#e8e9eb"/><stop offset="1" stop-color="#9c9fa5"/>
  </linearGradient></defs>
  <path d="M8 70 L8 26 L32 48 L46 12 L60 40 L74 12 L88 48 L112 26 L112 70 Z" fill="url(#${id})"/>
  <rect x="8" y="75" width="104" height="13" rx="2" fill="url(#${id})"/>
  <circle cx="8" cy="22" r="5" fill="url(#${id})"/><circle cx="46" cy="8" r="5" fill="url(#${id})"/>
  <circle cx="74" cy="8" r="5" fill="url(#${id})"/><circle cx="112" cy="22" r="5" fill="url(#${id})"/>
  <path d="M60 50 L66 60 L60 70 L54 60 Z" fill="#c8102e"/>
</svg>`;
}
const logoMark = size => LOGO_MARK
  ? `<img class="logo-img" src="${LOGO_MARK}" style="height:${size}px" alt="Crowning Point">`
  : crownSvg(size);
const wordmark = cls => LOGO_WORDMARK
  ? `<img class="logo-img ${cls}" src="${LOGO_WORDMARK}" alt="Crowning Point">`
  : `<div class="wordmark ${cls}"><span class="chrome">CROWNING POINT</span></div>`;

const baseCss = `
@font-face{font-family:'Barlow Condensed';font-weight:500;src:url(${fontUrl('barlow-condensed', 'barlow-condensed-latin-500-normal.woff2')})}
@font-face{font-family:'Barlow Condensed';font-weight:600;src:url(${fontUrl('barlow-condensed', 'barlow-condensed-latin-600-normal.woff2')})}
@font-face{font-family:'Barlow Condensed';font-weight:700;src:url(${fontUrl('barlow-condensed', 'barlow-condensed-latin-700-normal.woff2')})}
@font-face{font-family:'Barlow Condensed';font-weight:800;src:url(${fontUrl('barlow-condensed', 'barlow-condensed-latin-800-normal.woff2')})}
@font-face{font-family:'Manrope';font-weight:400;src:url(${fontUrl('manrope', 'manrope-latin-400-normal.woff2')})}
@font-face{font-family:'Manrope';font-weight:600;src:url(${fontUrl('manrope', 'manrope-latin-600-normal.woff2')})}
@font-face{font-family:'Manrope';font-weight:700;src:url(${fontUrl('manrope', 'manrope-latin-700-normal.woff2')})}
@font-face{font-family:'Cormorant Garamond';font-style:italic;font-weight:600;src:url(${fontUrl('cormorant-garamond', 'cormorant-garamond-latin-600-italic.woff2')})}
:root{--ink:#0a0a0b;--panel:#141417;--panel2:#1b1b1f;--line:#2c2c32;--red:#c8102e;--red2:#8e0c20;--text:#ededee;--muted:#9c9ca3;
  --chrome:linear-gradient(180deg,#fff 0%,#d9dade 36%,#8a8d93 52%,#eceded 68%,#b3b5ba 100%)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--ink);color:var(--text);font-family:'Manrope',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.d{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.02em}
.chrome{background:var(--chrome);-webkit-background-clip:text;background-clip:text;color:transparent}
.serif{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600}
.red{color:var(--red)} .muted{color:var(--muted)}
.pill{display:inline-block;font-family:'Barlow Condensed';font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:var(--red);color:#fff;padding:3px 10px;border-radius:2px}
.pill.ghost{background:transparent;border:1px solid #55555c;color:var(--muted)}
.rule{height:1px;background:linear-gradient(90deg,transparent,#8a8d93,transparent)}
.wordmark{font-family:'Barlow Condensed';font-weight:800;letter-spacing:.28em}
.logo-img{display:block;object-fit:contain}
.glow{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 50% -10%,rgba(200,16,46,.33),transparent 55%),radial-gradient(ellipse at 100% 110%,rgba(200,16,46,.16),transparent 50%)}
.page>*:not(.glow):not(.foot):not(.co),.s>*:not(.glow){position:relative;z-index:1}
`;

// ---------------- PDF PLAYBOOK ----------------
const pageCss = `
@page{size:Letter;margin:0}
/* Chromium's PDF output draws box edges around background-clip:text, so print chrome as solid silver */
.page .chrome{background:none;color:#e2e3e6}
.page{width:8.5in;height:11in;position:relative;overflow:hidden;padding:.6in .65in;page-break-after:always;background:var(--ink)}
.page:last-child{page-break-after:auto}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.hdr .wordmark{font-size:13px}
.hdr .wk{font-family:'Barlow Condensed';font-weight:600;letter-spacing:.16em;font-size:12px;color:var(--muted)}
.foot{position:absolute;z-index:1;bottom:.38in;left:.65in;right:.65in;display:flex;justify-content:space-between;font-family:'Barlow Condensed';letter-spacing:.16em;font-size:10.5px;color:#6d6d74}
h1.t{font-family:'Barlow Condensed';font-weight:800;text-transform:uppercase;font-size:46px;line-height:.95;letter-spacing:.01em}
h2.t{font-family:'Barlow Condensed';font-weight:800;text-transform:uppercase;font-size:21px;letter-spacing:.06em;margin:18px 0 8px}
.lede{font-size:13px;line-height:1.55;color:#cfcfd4;max-width:6.4in}
/* cover */
.cover{display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;padding-top:.2in}
.cover .kicker{font-family:'Barlow Condensed';font-weight:600;letter-spacing:.42em;font-size:14px;color:var(--muted);margin-top:22px}
.cover .big{font-family:'Barlow Condensed';font-weight:800;font-size:92px;line-height:.9;margin:14px 0 6px}
.cover .theme{font-family:'Barlow Condensed';font-weight:800;font-size:40px;letter-spacing:.14em;color:var(--red);margin-top:18px}
.cover .tag{font-size:26px;margin-top:10px;color:#e4e4e7;max-width:5.8in}
.cover .stat{margin-top:40px;border:1px solid var(--line);background:rgba(20,20,23,.8);padding:18px 26px;display:flex;gap:22px;align-items:center;max-width:6.2in;text-align:left}
.cover .stat b{font-family:'Barlow Condensed';font-weight:800;font-size:56px;line-height:1}
.cover .stat span{font-size:12.5px;line-height:1.5;color:#cfcfd4}
.cover .co{position:absolute;z-index:1;bottom:.55in;left:0;right:0;font-family:'Barlow Condensed';letter-spacing:.36em;font-size:12px;color:var(--muted)}
/* clock */
.clock{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0 4px}
.clock>div{background:var(--panel);border-top:3px solid var(--red);padding:10px 12px}
.clock .tm{font-family:'Barlow Condensed';font-weight:800;font-size:26px;line-height:1}
.clock .bl{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.1em;font-size:14px;margin-top:4px}
.clock .mn{font-family:'Barlow Condensed';font-size:11px;letter-spacing:.14em;color:var(--red);font-weight:700}
.clock p{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:5px}
/* week grid */
.wk-row{display:grid;grid-template-columns:78px 1fr 150px;gap:14px;align-items:center;padding:13px 0;border-bottom:1px solid var(--line)}
.wk-row .dd{font-family:'Barlow Condensed';font-weight:800;font-size:30px;line-height:.9}
.wk-row .dd small{display:block;font-size:12px;letter-spacing:.14em;color:var(--muted);font-weight:600;margin-top:3px}
.wk-row .ln{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.14em;font-size:12px;color:var(--red)}
.wk-row .ti{font-family:'Barlow Condensed';font-weight:700;font-size:22px;text-transform:uppercase;line-height:1.05;margin-top:2px}
.wk-row .fm{text-align:right}
.wk-row.battle{background:linear-gradient(90deg,rgba(200,16,46,.22),transparent);border-left:3px solid var(--red);padding-left:10px}
/* day page */
.dayhead{display:flex;gap:18px;align-items:flex-end;margin-bottom:14px}
.dayhead .dd{font-family:'Barlow Condensed';font-weight:800;font-size:84px;line-height:.8}
.dayhead .meta{padding-bottom:4px}
.dayhead .date{font-family:'Barlow Condensed';letter-spacing:.2em;font-size:13px;color:var(--muted);margin-top:8px}
.blk{display:grid;grid-template-columns:92px 1fr;gap:16px;padding:16px 0;border-top:1px solid var(--line)}
.blk .lab .tm{font-family:'Barlow Condensed';font-weight:800;font-size:22px;line-height:1}
.blk .lab .nm{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.12em;font-size:11.5px;color:var(--red);margin-top:3px}
.blk p,.blk li{font-size:13px;line-height:1.55;color:#dcdce0}
.blk ul{padding-left:16px;margin-top:6px}.blk li{margin:3px 0}
.blk .big{font-size:14.2px;color:#fff;font-weight:600}
.steal{margin-top:10px;background:var(--panel);border-left:3px solid var(--red);padding:10px 14px}
.steal .k{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.18em;font-size:10.5px;color:var(--red)}
.steal .q{font-family:'Cormorant Garamond';font-style:italic;font-weight:600;font-size:20px;line-height:1.3;color:#fff;margin-top:2px}
.fmt{font-family:'Barlow Condensed';font-weight:800;font-size:17px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}
/* battle */
.rules li{font-size:12px;line-height:1.5;margin:5px 0;color:#dcdce0}
.rounds{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
.round{background:var(--panel);padding:12px 14px;border-top:3px solid var(--red)}
.round .rn{font-family:'Barlow Condensed';font-weight:800;letter-spacing:.08em;font-size:15px}
.round .ob{font-family:'Cormorant Garamond';font-style:italic;font-weight:600;font-size:16px;line-height:1.3;margin:6px 0;color:#fff}
.round .hd{font-size:10.8px;line-height:1.45;color:var(--muted)}
.prize{margin-top:12px;border:1px solid var(--red);padding:10px 14px;font-family:'Barlow Condensed';font-weight:700;letter-spacing:.08em;font-size:15px;text-transform:uppercase}
/* tables */
table.rot{width:100%;border-collapse:collapse;margin-top:6px}
table.rot th{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.12em;font-size:11px;color:var(--red);text-align:left;padding:6px 6px;border-bottom:1px solid #45454c}
table.rot td{font-size:10.6px;line-height:1.35;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top;color:#dcdce0}
table.rot td.wk{font-family:'Barlow Condensed';font-weight:800;font-size:15px;color:#fff;white-space:nowrap}
table.rot tr.now td{background:rgba(200,16,46,.12)}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cards.c3{grid-template-columns:repeat(3,1fr)}
.card{background:var(--panel);padding:10px 13px}
.card .n{font-family:'Barlow Condensed';font-weight:800;letter-spacing:.08em;font-size:15px}
.card p{font-size:10.9px;line-height:1.45;color:#cfcfd4;margin-top:3px}
.awards{columns:2;column-gap:20px;margin-top:4px}
.awards div{font-size:11.5px;padding:5px 0;border-bottom:1px solid var(--line);break-inside:avoid}
.awards b{font-family:'Barlow Condensed';letter-spacing:.06em;font-size:14px}
.res{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.res .card .n small{display:block;font-family:'Manrope';font-weight:600;letter-spacing:0;text-transform:none;font-size:10px;color:var(--red)}
.data{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:4px}
.data div{background:var(--panel2);padding:10px}
.data b{font-family:'Barlow Condensed';font-weight:800;font-size:28px;display:block;line-height:1}
.data span{font-size:9.8px;line-height:1.4;color:#bdbdc3;display:block;margin-top:4px}
.comp li{font-size:10.6px;line-height:1.45;color:#bdbdc3;margin:3px 0 3px 14px}
`;

const hdr = () => `<div class="hdr">${wordmark('')}<div class="wk">WEEK OF ${esc(W.dates)} · ${esc(W.theme)}</div></div>`;
const foot = n => `<div class="foot"><span>RESOLUTE × CROWNING POINT · MORNING TRAINING</span><span>${n}</span></div>`;
const clockHtml = () => `<div class="clock">${F.clock.map(c => `<div><div class="tm chrome">${c.time}</div><div class="bl">${c.block}</div><div class="mn">${c.mins}</div><p>${esc(c.what)}</p></div>`).join('')}</div>`;

function coverPage() {
  return `<section class="page cover"><div class="glow"></div>
  ${logoMark(150)}
  <div style="margin-top:18px">${wordmark('')}</div>
  <div class="kicker">MORNING SALES TRAINING · 9:00 AM</div>
  <div class="big chrome">THE 30</div>
  <div class="d muted" style="letter-spacing:.3em;font-size:16px">WEEK OF ${esc(W.dates)}</div>
  <div class="theme">${esc(W.theme)}</div>
  <div class="tag serif">${esc(W.tagline)}</div>
  <div class="stat"><b class="chrome">${esc(W.weeklyStat.value)}</b><span>${esc(W.weeklyStat.label)}</span></div>
  <div class="co">RESOLUTE × CROWNING POINT · TAMPA, FL · ROTATION WEEK ${W.rotationWeek} OF 4</div>
</section>`;
}

function glancePage(n) {
  return `<section class="page"><div class="glow"></div>${hdr()}
  <h1 class="t chrome">The Week at a Glance</h1>
  <p class="lede" style="margin-top:8px">Thirty minutes, every morning, then straight to the phones at 9:30. The clock stays the same every day. The topic and the drill change every day.</p>
  <h2 class="t">The Daily 30</h2>${clockHtml()}
  <h2 class="t">This Week</h2>
  ${W.days.map(d => `<div class="wk-row ${d.lane.includes('BATTLE') ? 'battle' : ''}">
    <div class="dd chrome">${d.day}<small>${d.date}</small></div>
    <div><div class="ln">${esc(d.lane)}</div><div class="ti">${esc(d.title)}</div></div>
    <div class="fm"><span class="pill ghost">${esc(d.format)}</span></div></div>`).join('')}
  ${foot(n)}</section>`;
}

function dayPage(d, n) {
  const c = F.clock;
  return `<section class="page"><div class="glow"></div>${hdr()}
  <div class="dayhead"><div class="dd chrome">${d.day}</div>
    <div class="meta"><span class="pill">${esc(d.lane)}</span><h1 class="t" style="font-size:38px;margin-top:6px">${esc(d.title)}</h1><div class="date">${d.date} · 9:00–9:30 AM</div></div></div>
  <div class="blk"><div class="lab"><div class="tm chrome">${c[0].time}</div><div class="nm">CROWN CALL</div></div><div><p>${esc(d.crownCall)}</p></div></div>
  <div class="blk"><div class="lab"><div class="tm chrome">${c[1].time}</div><div class="nm">THE LESSON</div></div><div>
    <p class="big">${esc(d.lesson.bigIdea)}</p>
    <ul>${d.lesson.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    <div class="steal"><div class="k">STEAL THIS LINE</div><div class="q">“${esc(d.lesson.stealThisLine)}”</div></div></div></div>
  <div class="blk"><div class="lab"><div class="tm chrome">${c[2].time}</div><div class="nm">LIVE REPS</div></div><div><div class="fmt chrome">${esc(d.reps.name)}</div><p>${esc(d.reps.how)}</p></div></div>
  <div class="blk"><div class="lab"><div class="tm chrome">${c[3].time}</div><div class="nm">LOCK-IN</div></div><div><p style="color:#fff;font-weight:600">${esc(d.lockIn)}</p></div></div>
  ${foot(n)}</section>`;
}

function battlePage(n) {
  const b = W.battle;
  const thu = W.days.find(d => d.lane.includes('BATTLE'));
  return `<section class="page"><div class="glow"></div>${hdr()}
  <div style="display:flex;gap:18px;align-items:center">${logoMark(70)}<div>
    <span class="pill">${thu ? `${thu.day} ${thu.date} · 9:00 AM` : 'THURSDAY · 9:00 AM'}</span>
    <h1 class="t chrome" style="font-size:52px;margin-top:6px">${esc(b.title)}</h1></div></div>
  <p class="lede serif" style="font-size:20px;margin-top:6px;color:#fff">${esc(b.subtitle)}</p>
  <h2 class="t">The Rules</h2>
  <ol class="rules" style="padding-left:18px">${b.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
  <h2 class="t">This Week's Objection Deck <span class="muted" style="font-size:12px;letter-spacing:.1em">· FOR THE LEADER. REVEAL THE HANDLES AFTER THE VOTE.</span></h2>
  <div class="rounds">${b.rounds.map(r => `<div class="round"><div class="rn chrome">${esc(r.round)}</div>
    ${r.objections.map(o => `<div class="ob">${esc(o)}</div>`).join('')}<div class="hd"><b style="color:#fff">Strong handle:</b> ${esc(r.handle)}</div></div>`).join('')}</div>
  <div class="prize">👑 ${esc(b.prize)}</div>
  ${foot(n)}</section>`;
}

function systemPage(n) {
  return `<section class="page"><div class="glow"></div>${hdr()}
  <h1 class="t chrome">The System</h1>
  <p class="lede" style="margin-top:8px">Six daily lanes and a four-week rotation. Same clock, different fight every day, and a new theme every week. After Week 4 the rotation starts over with new objections, drills and tape, so nobody runs the same session twice.</p>
  <h2 class="t">Daily Lanes</h2>
  <div class="cards">${F.lanes.map(l => `<div class="card"><div class="n"><span class="red">${l.day}</span> · ${esc(l.lane)}</div><p>${esc(l.what)}</p></div>`).join('')}</div>
  <h2 class="t">The 4-Week Rotation</h2>
  <table class="rot"><tr><th>WEEK</th><th>MON · OPEN</th><th>TUE · CONVO</th><th>WED · CEO</th><th>THU · BATTLE</th><th>FRI · FILM</th><th>SAT · ARENA</th></tr>
  ${F.rotation.map(r => `<tr class="${r.week === W.rotationWeek ? 'now' : ''}"><td class="wk">${r.week} · ${esc(r.theme)}</td><td>${esc(r.mon)}</td><td>${esc(r.tue)}</td><td>${esc(r.wed)}</td><td>${esc(r.thu)}</td><td>${esc(r.fri)}</td><td>${esc(r.sat)}</td></tr>`).join('')}</table>
  <h2 class="t">Rules That Keep It a Privilege, Not a Chore</h2>
  <div class="cards c3">${F.principles.map(p => `<div class="card"><div class="n">${esc(p.t)}</div><p>${esc(p.d)}</p></div>`).join('')}</div>
  ${foot(n)}</section>`;
}

function culturePage(n) {
  return `<section class="page"><div class="glow"></div>${hdr()}
  <h1 class="t chrome">Culture Events</h1>
  <p class="lede" style="margin-top:8px">These are layered on top of what you already run: Throw-Down Thursday, the Saturday 12 PM EOW, Sunday team day, and the $10K issue week that earns a Fernando's suit.</p>
  <div class="cards" style="margin-top:14px">${F.culture.map(c => `<div class="card"><div class="n chrome">${esc(c.name)}</div><p>${esc(c.what)}</p></div>`).join('')}</div>
  <h2 class="t">The Crowning Ceremony · Monthly Awards</h2>
  <div class="awards">${F.awards.map(a => { const [t, d] = a.split(' · '); return `<div><b>${esc(t)}</b> <span class="muted">· ${esc(d)}</span></div>`; }).join('')}</div>
  <div class="steal" style="margin-top:16px"><div class="k">NEXT ARENA</div><div class="q">${esc(W.arenaNext)}</div></div>
  ${foot(n)}</section>`;
}

function researchPage(n) {
  return `<section class="page"><div class="glow"></div>${hdr()}
  <h1 class="t chrome" style="font-size:40px">Research Digest</h1>
  <p class="lede" style="margin-top:6px">What the top trainers teach, boiled down to what our agents can use on a phone call today.</p>
  <div class="res" style="margin-top:10px">${F.research.map(r => `<div class="card"><div class="n">${esc(r.who)}<small>${esc(r.what)}</small></div><p>${esc(r.steal)}</p></div>`).join('')}</div>
  <h2 class="t" style="margin-top:12px">The Numbers</h2>
  <div class="data">${F.data.map(d => `<div><b class="chrome">${esc(d.stat)}</b><span>${esc(d.text)}</span></div>`).join('')}</div>
  <h2 class="t" style="margin-top:12px">Stay Clean</h2>
  <ul class="comp">${F.compliance.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  ${foot(n)}</section>`;
}

function playbookHtml() {
  let n = 1;
  const pages = [coverPage()];
  pages.push(glancePage(++n));
  for (const d of W.days) pages.push(dayPage(d, ++n));
  pages.push(battlePage(++n), systemPage(++n), culturePage(++n), researchPage(++n));
  return `<!doctype html><html><head><meta charset="utf-8"><title>Morning Training · ${esc(W.dates)}</title><style>${baseCss}${pageCss}</style></head><body>${pages.join('\n')}</body></html>`;
}

// ---------------- SOCIAL GRAPHICS ----------------
const socialCss = `
.s{position:relative;overflow:hidden;background:var(--ink);padding:70px 72px;display:flex;flex-direction:column}
.s .top{display:flex;align-items:center;gap:22px}
.s .top .wordmark{font-size:26px}
.s .kick{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.34em;font-size:26px;color:var(--muted)}
.s .h{font-family:'Barlow Condensed';font-weight:800;text-transform:uppercase;line-height:.88}
.s .row{display:grid;grid-template-columns:130px 1fr;gap:24px;align-items:center;padding:20px 0;border-bottom:1px solid var(--line)}
.s .row .dd{font-family:'Barlow Condensed';font-weight:800;font-size:58px;line-height:.85}
.s .row .dd small{display:block;font-size:20px;letter-spacing:.16em;color:var(--muted);font-weight:600;margin-top:4px}
.s .row .ln{font-family:'Barlow Condensed';font-weight:700;letter-spacing:.18em;font-size:21px;color:var(--red)}
.s .row .ti{font-family:'Barlow Condensed';font-weight:700;text-transform:uppercase;font-size:38px;line-height:1.02;margin-top:3px}
.s .row.battle{background:linear-gradient(90deg,rgba(200,16,46,.28),transparent);border-left:5px solid var(--red);padding-left:18px}
.s .bottom{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;font-family:'Barlow Condensed';font-weight:700;letter-spacing:.2em;font-size:22px;color:var(--muted)}
`;
const socialDoc = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}${socialCss}
html,body{width:${w}px;height:${h}px}.s{width:${w}px;height:${h}px}</style></head><body>${body}</body></html>`;

function feedSchedule(story) {
  const h = story ? 1920 : 1350;
  return socialDoc(1080, h, `<div class="s"><div class="glow"></div>
  <div class="top">${logoMark(story ? 96 : 80)}${wordmark('')}</div>
  <div style="margin-top:${story ? 90 : 44}px" class="kick">MORNING TRAINING · 9:00 AM</div>
  <div class="h chrome" style="font-size:${story ? 150 : 118}px;margin-top:10px">${esc(W.theme)}</div>
  <div class="d" style="font-size:30px;letter-spacing:.24em;margin-top:14px;color:#fff">WEEK OF ${esc(W.dates)}</div>
  <div style="margin-top:${story ? 70 : 34}px">
  ${W.days.map(d => `<div class="row ${d.lane.includes('BATTLE') ? 'battle' : ''}" ${story ? 'style="padding:30px 0"' : ''}><div class="dd chrome">${d.day}<small>${d.date}</small></div>
    <div><div class="ln">${esc(d.lane)}</div><div class="ti">${esc(d.title)}</div></div></div>`).join('')}
  </div>
  <div style="margin-top:${story ? 70 : 36}px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${F.clock.map(c => `<div style="background:var(--panel);border-top:4px solid var(--red);padding:14px 16px"><div class="h chrome" style="font-size:40px">${c.time}</div><div class="d" style="font-weight:700;font-size:21px;letter-spacing:.1em;margin-top:6px">${c.block}</div></div>`).join('')}</div>
  <div class="bottom"><span>TAMPA, FL</span><span class="red">RESOLUTE × CROWNING POINT</span></div></div>`);
}

function feedBattle() {
  const thu = W.days.find(d => d.lane.includes('BATTLE'));
  return socialDoc(1080, 1350, `<div class="s" style="align-items:center;text-align:center"><div class="glow" style="background:radial-gradient(ellipse at 50% 30%,rgba(200,16,46,.45),transparent 60%)"></div>
  <div style="margin-top:30px">${logoMark(230)}</div>
  <div class="kick" style="margin-top:36px">${thu ? `${thu.day === 'THU' ? 'THURSDAY' : thu.day} ${thu.date}` : 'THURSDAY'} · 9:00 AM</div>
  <div class="h chrome" style="font-size:150px;margin-top:18px">BATTLE<br>FOR THE<br>CROWN</div>
  <div class="serif" style="font-size:46px;margin-top:26px;color:#fff">Last man standing wears the crown.</div>
  <div style="display:flex;gap:14px;margin-top:40px;flex-wrap:wrap;justify-content:center">${W.battle.rounds.map(r => `<span class="pill" style="font-size:20px;padding:8px 16px">${esc(r.round.split('·')[1] || r.round).trim()}</span>`).join('')}</div>
  <div class="d" style="margin-top:60px;font-weight:700;font-size:30px;letter-spacing:.12em;color:#fff">ROOKIES IN. VETS DEFEND. THE ROOM VOTES.</div>
  <div class="d muted" style="margin-top:12px;font-weight:600;font-size:24px;letter-spacing:.16em">WINNER HOLDS THE CROWN ALL WEEK</div>
  <div class="bottom" style="width:100%"><span>OBJECTION ELIMINATION</span><span class="red">RESOLUTE × CROWNING POINT</span></div></div>`);
}

// ---------------- GOOGLE DOC HTML (light theme, converts cleanly) ----------------
function docHtml() {
  const red = '#b00d27';
  const H = (t, lvl = 2) => `<h${lvl} style="font-family:Arial;color:${lvl === 1 ? '#000' : red};text-transform:uppercase">${esc(t)}</h${lvl}>`;
  const day = d => `${H(`${d.day} ${d.date} · ${d.lane} · ${d.title}`)}
  <p><b>9:00 CROWN CALL:</b> ${esc(d.crownCall)}</p>
  <p><b>9:03 THE LESSON:</b> ${esc(d.lesson.bigIdea)}</p><ul>${d.lesson.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
  <p><b>Steal this line:</b> <i>“${esc(d.lesson.stealThisLine)}”</i></p>
  <p><b>9:13 LIVE REPS · ${esc(d.reps.name)}:</b> ${esc(d.reps.how)}</p>
  <p><b>9:27 LOCK-IN:</b> ${esc(d.lockIn)}</p>`;
  return `<html><head><meta charset="utf-8"></head><body style="font-family:Arial">
  <h1 style="font-family:Arial">CROWNING POINT · MORNING TRAINING</h1>
  <p><b>WEEK OF ${esc(W.dates)} · ${esc(W.theme)}</b> (Rotation week ${W.rotationWeek} of 4)<br><i>${esc(W.tagline)}</i></p>
  <p><b>Stat of the week: ${esc(W.weeklyStat.value)}.</b> ${esc(W.weeklyStat.label)}</p>
  <p>PDF playbook + Instagram graphics: https://github.com/ejhawk06/training/tree/claude/dazzling-euler-fsffl9/weeks/${weekId}</p>
  ${H('The Daily 30 (9:00–9:30 AM)')}
  <table border="1" cellpadding="6" style="border-collapse:collapse"><tr>${F.clock.map(c => `<td><b>${c.time} ${c.block}</b><br>${c.mins}<br>${esc(c.what)}</td>`).join('')}</tr></table>
  ${H('Week at a Glance')}
  <table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Day</th><th>Lane</th><th>Session</th><th>Drill</th></tr>
  ${W.days.map(d => `<tr><td><b>${d.day} ${d.date}</b></td><td>${esc(d.lane)}</td><td>${esc(d.title)}</td><td>${esc(d.format)}</td></tr>`).join('')}</table>
  ${W.days.map(day).join('')}
  ${H(W.battle.title)}<p><i>${esc(W.battle.subtitle)}</i></p><ol>${W.battle.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
  ${W.battle.rounds.map(r => `<p><b>${esc(r.round)}:</b> ${r.objections.map(esc).join(' / ')}<br><b>Strong handle:</b> ${esc(r.handle)}</p>`).join('')}
  <p><b>${esc(W.battle.prize)}</b></p>
  ${H('The 4-Week Rotation')}
  <table border="1" cellpadding="5" style="border-collapse:collapse"><tr><th>Week</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr>
  ${F.rotation.map(r => `<tr><td><b>${r.week} · ${esc(r.theme)}</b>${r.week === W.rotationWeek ? ' ◀ THIS WEEK' : ''}</td><td>${esc(r.mon)}</td><td>${esc(r.tue)}</td><td>${esc(r.wed)}</td><td>${esc(r.thu)}</td><td>${esc(r.fri)}</td><td>${esc(r.sat)}</td></tr>`).join('')}</table>
  ${H('Culture Events')}<ul>${F.culture.map(c => `<li><b>${esc(c.name)}:</b> ${esc(c.what)}</li>`).join('')}</ul>
  <p><b>Monthly awards:</b> ${F.awards.map(esc).join(' · ')}</p><p><b>Next Arena:</b> ${esc(W.arenaNext)}</p>
  ${H('Research Digest')}<ul>${F.research.map(r => `<li><b>${esc(r.who)} (${esc(r.what)}):</b> ${esc(r.steal)}</li>`).join('')}</ul>
  <ul>${F.data.map(d => `<li><b>${esc(d.stat)}:</b> ${esc(d.text)}</li>`).join('')}</ul>
  ${H('Stay Clean')}<ul>${F.compliance.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  </body></html>`;
}

// ---------------- RENDER ----------------
const browser = await chromium.launch();
const render = async (html, file, opts) => {
  const htmlPath = path.join(outDir, file.replace(/\.(pdf|png)$/, '.html'));
  fs.writeFileSync(htmlPath, html);
  const page = await browser.newPage(opts.viewport ? { viewport: opts.viewport, deviceScaleFactor: 1 } : {});
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (opts.pdf) await page.pdf({ path: path.join(outDir, file), format: 'Letter', printBackground: true, preferCSSPageSize: true });
  else await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  await page.close();
  fs.unlinkSync(htmlPath);
};

const slug = `crowning-point-morning-training-${weekId}`;
await render(playbookHtml(), `${slug}.pdf`, { pdf: true });
await render(feedSchedule(false), 'ig-feed-schedule-1080x1350.png', { viewport: { width: 1080, height: 1350 } });
await render(feedSchedule(true), 'ig-story-schedule-1080x1920.png', { viewport: { width: 1080, height: 1920 } });
await render(feedBattle(), 'ig-feed-battle-1080x1350.png', { viewport: { width: 1080, height: 1350 } });
fs.writeFileSync(path.join(outDir, 'google-doc.html'), docHtml());
// Preview PNGs of the PDF pages (for quick visual checks)
await browser.close();
console.log('built', outDir, fs.readdirSync(outDir));
