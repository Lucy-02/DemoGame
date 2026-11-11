// 카드 일러스트 후보를 정본 카드 틀(design/canon/battle-r5/page.html의 CSS·마크업) 안에 넣어 실제 크기로 비교하는 시트를 만들어요.
// 쓰는 법: node tools/art/card-preview.mjs <미리보기 폴더(index.json + <case_id>.jpg)> <저장 폴더> [저장소 루트]
// 결과: sheet@1x.png (실제 크기 판단용), sheet@2x.png (보기용), hand@1x.png·hand@2x.png (손패 줄)
// 손패 카드(84×90 창)는 그림을 가운데 맞춰 덮고(cover), 확대 카드(208×150 창)도 같은 원화를 덮어요. 틀의 윗선은 정령별 정본이 없어 별 정령 모양을 임시로 써요.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [previewDir, outDir, root = process.cwd()] = process.argv.slice(2);
if (!previewDir || !outDir) { console.error("usage: card-preview.mjs <previews> <out> [root]"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const raw = JSON.parse(fs.readFileSync(path.join(previewDir, "index.json"), "utf8"));
const src = raw.cases ?? raw;
const entries = Array.isArray(src) ? src : Object.entries(src).map(([case_id, v]) => ({ case_id, ...v }));
const briefsPath = process.env.BRIEFS || path.join(root, "design/card/art/rounds/r1/briefs.json");
const briefs = JSON.parse(fs.readFileSync(briefsPath, "utf8"));
const names = Object.fromEntries(briefs.cards.map((c) => [c.id, c.name]));
const owners = Object.fromEntries(briefs.cards.map((c) => [c.id, c.owner]));
const faces = JSON.parse(fs.readFileSync(path.join(root, "tools/art/faces.json"), "utf8"));
const OWNER_DIR = { sal: "glass-salamander", ibex: "magma-ibex", pearl: "pearl-oyster", cham: "prism-chameleon" };

function faceFor(owner) {
  const dir = OWNER_DIR[owner];
  if (!dir) return { url: pathToFileURL(path.join(root, "design/canon/battle-r5/img/star-face.webp")).href };
  const f = faces[`${dir}/adult`];
  const url = pathToFileURL(path.join(root, `public/assets/spirits/${dir}/adult.webp`)).href;
  const box = f?.faces?.[0];
  if (!box) return { url };
  const [, x1, y1, x2, y2] = box;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, side = Math.max(x2 - x1, (y2 - y1) * f.size[1] / f.size[0]) * 2.4;
  return { url, cx, cy, side, aspect: f.size[1] / f.size[0] };
}

const cards = entries.map((e) => {
  const [id, comp, style, seed] = e.case_id.split("-");
  const owner = owners[id] ?? id.split("_")[0];
  return {
    case_id: e.case_id, id, comp, style, seed, owner, name: names[id] ?? id,
    img: pathToFileURL(path.resolve(previewDir, `${e.case_id}.jpg`)).href,
    styleKey: e.style_key ?? e.style ?? "", face: faceFor(owner),
  };
});

const browser = await chromium.launch();
for (const dpr of [1, 2]) {
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: dpr });
await page.goto(pathToFileURL(path.join(root, "design/canon/battle-r5/page.html")).href);
await page.evaluate((cards) => {
  const hTpl = document.querySelector("#rest-c-pierce").cloneNode(true);
  const xTpl = document.querySelector("#h3-x-pierce").cloneNode(true);
  const defs = document.querySelector("body > svg").cloneNode(true);
  document.body.innerHTML = "";
  document.body.append(defs);
  const frame = document.createElement("div"); frame.className = "frame pv"; document.body.append(frame);
  const st = document.createElement("style");
  st.textContent = `
    body{margin:0;background:#2e2c2a;color:#e8e4dc;font:12px Orbit,sans-serif}
    .frame.pv{position:static;transform:none;width:auto;height:auto;overflow:visible;background:#2e2c2a}
    .sheet{padding:16px;display:flex;flex-direction:column;gap:18px}
    .grp h2{font-size:14px;margin:0 0 6px}
    .row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end}
    .v{display:flex;flex-direction:column;gap:4px;align-items:center}
    .pair{display:flex;gap:6px;align-items:flex-end}
    .cap{font-size:10px;opacity:.8;max-width:330px;text-align:center}
    .gray{filter:grayscale(1)}
    .cd{position:relative!important;inset:auto!important;transform:none!important;opacity:1!important}
    .strip{display:flex;gap:4px;padding:16px;background:#2e2c2a}
    .artlayer{position:absolute;left:0;top:0;object-fit:cover;object-position:50% 50%;display:block}
  `;
  document.head.append(st);
  const mk = (tpl, c, gray) => {
    const el = tpl.cloneNode(true);
    el.removeAttribute("id");
    el.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    el.classList.remove("off");
    const win = el.querySelector(".win");
    const ws = el.querySelector(".winsvg");
    // 정본 별 윗선 path는 오른쪽 위 꼭짓점(84,11)이 빠져 오른쪽이 비스듬히 잘려요(layout.ts도 같음). 미리보기에서는 꼭짓점을 넣어 창 전체를 보여요.
    const d = ws.querySelector("path").getAttribute("d").replace("L69.0 11 L84 85", "L69.0 11 L84 11 L84 85").replace("L168.1 22 L208 145", "L168.1 22 L208 22 L208 145");
    ws.querySelector("path").setAttribute("d", d);
    const w = +ws.getAttribute("width"), h = +ws.getAttribute("height");
    el.querySelector(".ai").remove();
    const art = document.createElement("img");
    art.className = "artlayer"; art.src = c.img;
    Object.assign(art.style, { width: w + "px", height: h + "px", clipPath: `path("${d}")` });
    win.append(art);
    const nm = el.querySelector(".nm"); if (nm) nm.textContent = c.name;
    const img = el.querySelector(".notch img");
    if (img) {
      const f = c.face;
      if (f.cx != null) {
        const holder = document.createElement("span");
        const size = img.parentElement.clientWidth || 26;
        Object.assign(holder.style, { display: "block", width: "100%", height: "100%", borderRadius: "50%", backgroundImage: `url("${f.url}")`,
          backgroundSize: `${100 / f.side}% auto`, backgroundPosition: `${(f.cx - f.side / 2) / (1 - f.side) * 100}% ${((f.cy * f.aspect) - f.side / 2) / (f.aspect - f.side) * 100}%`, backgroundRepeat: "no-repeat" });
        img.replaceWith(holder);
      } else img.src = f.url;
    }
    if (gray) el.classList.add("gray");
    return el;
  };
  const sheet = document.createElement("div"); sheet.className = "sheet"; frame.append(sheet);
  const groups = {};
  for (const c of cards) (groups[c.id] ??= []).push(c);
  for (const [id, list] of Object.entries(groups)) {
    const g = document.createElement("div"); g.className = "grp";
    g.innerHTML = `<h2>${id} ${list[0].name}</h2>`;
    const row = document.createElement("div"); row.className = "row";
    for (const c of list) {
      const v = document.createElement("div"); v.className = "v"; v.dataset.case = c.case_id;
      const pair = document.createElement("div"); pair.className = "pair";
      pair.append(mk(hTpl, c, false), mk(hTpl, c, true), mk(xTpl, c, false));
      const cap = document.createElement("div"); cap.className = "cap"; cap.textContent = `${c.case_id} ${c.styleKey}`;
      v.append(pair, cap); row.append(v);
    }
    g.append(row); sheet.append(g);
  }
  // 손패 줄: 카드마다 첫 후보(owner 화풍, 첫 시드)
  const hand = document.createElement("div"); hand.className = "strip"; hand.id = "hand";
  const firsts = Object.values(groups).map((l) => l.find((c) => c.style === "o") ?? l[0]);
  for (const c of firsts) hand.append(mk(hTpl, c, false));
  frame.prepend(hand);
}, cards);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
await page.locator(".sheet").screenshot({ path: path.join(outDir, `sheet@${dpr}x.png`) });
await page.locator("#hand").screenshot({ path: path.join(outDir, `hand@${dpr}x.png`) });
// PER_CARD=1이면 후보마다 카드 묶음(손패·흑백·확대)을 따로 저장해요 (보드용, 2x만).
if (process.env.PER_CARD && dpr === 2) {
  fs.mkdirSync(path.join(outDir, "cards"), { recursive: true });
  for (const c of cards) await page.locator(`.v[data-case="${c.case_id}"] .pair`).screenshot({ path: path.join(outDir, "cards", `${c.case_id}.png`) });
}
await page.close();
}
await browser.close();
console.log("ok", cards.length);
