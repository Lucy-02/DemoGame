// 정령 일러스트 피팅 페이지 (개발 서버 전용: pnpm dev:web → /spirit-fit.html). 결정 0023
// 정령·단계마다 크기·위치·띠 타일 얼굴을 맞추고 저장하면 src/presentation/spiritFit.json이 바뀌고, 열려 있는 게임 화면도 다시 불러와요.
// 그리는 계산은 게임과 같은 src/presentation/spirits/artFit.ts라서, 여기서 본 모습이 게임 모습이에요.
import { SPIRITS } from "../../src/core/data";
import { STAGES, type Stage } from "../../src/core/types";
import { tokens } from "../../src/design/tokens";
import framesJson from "../../src/presentation/spiritFrames.json";
import { paintArt, paintTileFace, placeArt, tileCrop, type Crop, type Fit, type Fits, type Frames } from "../../src/presentation/spirits/artFit";
import { STAGE_LABEL } from "../../src/presentation/spirits/copy";
import { ART, BG, FACTS, FRAME, ID, PANEL, RAIL, SCRIM, STRIP, TOP } from "../../src/presentation/spirits/layout";
import { MOCKUPS } from "../../src/presentation/spirits/mockups";
import { transparentOf, withAlpha } from "../../src/presentation/style/color";
import { ellipse, linear } from "../../src/presentation/style/gradient";

const P = tokens.provisional.palette;
const FRAMES = framesJson as unknown as Frames;
/** 정본 이름 카드 높이 (그림 위 UI 자리 안내용, 정령마다 조금 달라요) */
const ID_H = 224;
/** 띠 타일 얼굴 지름 (STRIP.ring.d - faceInset×2) */
const TILE_D = STRIP.ring.d - STRIP.ring.faceInset * 2;

const NAMES: Record<string, string> = Object.fromEntries([
  ...SPIRITS.map((s) => [s.id, s.name]),
  ...MOCKUPS.map((m) => [m.id, m.name]),
]);
const IDS = Object.keys(FRAMES).sort((a, b) => order(a) - order(b));
function order(id: string) {
  const i = SPIRITS.findIndex((s) => s.id === id);
  return i >= 0 ? i : SPIRITS.length + MOCKUPS.findIndex((m) => m.id === id);
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const view = $<HTMLCanvasElement>("view");
const vctx = view.getContext("2d")!;

const state = {
  id: IDS[0],
  stage: "awakened" as Stage,
  fits: {} as Fits,
  saved: "",
  ghost: "" as string, // "id/stage" 겹쳐 볼 정령
  closed: false,
  guide: true,
  ui: true,
  grid: false,
  gridStage: "awakened" as Stage,
};

// ───────────────────────── 그림 불러오기 ─────────────────────────

const images = new Map<string, HTMLImageElement>();
const file = (id: string, stage: Stage) => `/assets/spirits/${id.replaceAll("_", "-")}/${stage}.webp`;
function image(id: string, stage: Stage): HTMLImageElement | undefined {
  const k = `${id}/${stage}`;
  let im = images.get(k);
  if (!im) {
    im = new Image();
    im.src = file(id, stage);
    im.onload = () => paint();
    images.set(k, im);
  }
  return im.complete && im.naturalWidth ? im : undefined;
}

// ───────────────────────── 조정값 ─────────────────────────

const fitOf = (id: string, stage: Stage): Fit => state.fits[id]?.[stage] ?? {};
/** 지금 정령·단계의 조정값을 바꿔요. null이면 모두 되돌려요 */
function setFit(patch: Partial<Fit> | null) {
  replaceFit(patch === null ? {} : { ...fitOf(state.id, state.stage), ...patch });
}
function replaceFit(fit: Fit) {
  const { id, stage } = state;
  const next: Fit = { ...fit };
  // 기본값과 같은 값은 지워요 (파일을 짧게)
  if (next.s !== undefined && Math.abs(next.s - 1) < 1e-4) delete next.s;
  if (next.dx === 0) delete next.dx;
  if (next.dy === 0) delete next.dy;
  const stages = { ...(state.fits[id] ?? {}) };
  if (Object.keys(next).length) stages[stage] = next;
  else delete stages[stage];
  state.fits = { ...state.fits, [id]: stages };
  if (!Object.keys(stages).length) delete state.fits[id];
  paint();
}
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const dirty = () => JSON.stringify(state.fits) !== state.saved;

async function load() {
  state.fits = await (await fetch("/__spirit-fit")).json();
  state.saved = JSON.stringify(state.fits);
}

async function save() {
  const res = await fetch("/__spirit-fit", { method: "POST", body: JSON.stringify(state.fits) });
  const status = $("status");
  if (res.ok) {
    state.saved = JSON.stringify(state.fits);
    status.textContent = "저장했어요";
    status.className = "saved";
  } else {
    status.textContent = `저장 실패: ${await res.text()}`;
    status.className = "dirty";
  }
  list();
}

// ───────────────────────── 그리기 ─────────────────────────

const cxOf = () => ART.body.x + ART.body.w / 2 + (state.closed ? ART.closedShift : 0);

/** 게임 정령 관리 화면처럼: 배경 → 그림(번짐·사라짐) → 그늘 → UI 자리 */
function drawScreen(ctx: CanvasRenderingContext2D, id: string, stage: Stage, opts: { guide: boolean; ui: boolean; ghost?: string }) {
  const { w, h } = FRAME;
  ctx.clearRect(0, 0, w, h);
  ellipse(ctx, w, h, BG, [[P.wallHi, 0], [P.wall, BG.mid], [P.wallLo, 1]]);
  const im = image(id, stage);
  if (opts.ghost) {
    const [gid, gst] = opts.ghost.split("/") as [string, Stage];
    const gim = image(gid, gst);
    if (gim) {
      const at = placeArt(gim.naturalWidth, gim.naturalHeight, cxOf(), FRAMES[gid]?.[gst], fitOf(gid, gst));
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.drawImage(gim, at.x, at.y, at.w, at.h);
      ctx.restore();
    }
  }
  if (im) paintArt(ctx, im, placeArt(im.naturalWidth, im.naturalHeight, cxOf(), FRAMES[id]?.[stage], fitOf(id, stage)));
  const shade = (a: number) => withAlpha(P.scrim, a);
  linear(ctx, w, h, 180, [[shade(SCRIM.top.a), 0], [shade(0), SCRIM.top.to]]);
  linear(ctx, w, h, 90, [[shade(SCRIM.left.a), 0], [shade(0), SCRIM.left.to]]);
  linear(ctx, w, h, 0, [[P.scrim, 0], [transparentOf(P.scrim), SCRIM.bottomTo]]);
  // 위 막대·아래 띠
  ctx.fillStyle = withAlpha(P.scrim, 0.85);
  ctx.fillRect(0, 0, w, TOP.h);
  ctx.fillRect(0, h - STRIP.h, w, STRIP.h);
  if (opts.ui) {
    ctx.fillStyle = withAlpha(P.scrim, 0.55);
    ctx.strokeStyle = withAlpha(P.ink, 0.25);
    const box = (x: number, y: number, bw: number, bh: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, bw, bh, 14);
      ctx.fill();
      ctx.stroke();
    };
    box(ID.x, ID.y, ID.w, ID_H);
    if (state.closed) {
      box(w - RAIL.right - RAIL.w, RAIL.y, RAIL.w, RAIL.h);
      box(w - FACTS.right - FACTS.w, FACTS.y, FACTS.w, 374);
    } else box(w - PANEL.right - PANEL.w, PANEL.y, PANEL.w, PANEL.h);
  }
  if (opts.guide) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = withAlpha(P.ok, 0.7);
    ctx.lineWidth = 1;
    const line = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };
    line(cxOf(), TOP.h, cxOf(), h - STRIP.h);
    if (stage === "baby") line(0, ART.whole.bottom, w, ART.whole.bottom);
    else line(0, ART.upper.faceY, w, ART.upper.faceY);
    ctx.restore();
  }
}

function paint() {
  if (state.grid) paintGrid();
  else drawScreen(vctx, state.id, state.stage, { guide: state.guide, ui: state.ui, ghost: state.ghost || undefined });
  controls();
  const status = $("status");
  if (dirty()) {
    status.textContent = "저장 안 됨";
    status.className = "dirty";
  } else if (status.className === "dirty") {
    status.textContent = "";
    status.className = "";
  }
}

// ───────────────────────── 왼쪽 목록 ─────────────────────────

function list() {
  const el = $("list");
  el.innerHTML = "";
  for (const id of IDS) {
    const row = document.createElement("div");
    row.className = "row";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = NAMES[id] ?? id;
    row.append(name);
    for (const st of STAGES) {
      if (!FRAMES[id]?.[st]) continue;
      const img = document.createElement("img");
      img.src = file(id, st);
      img.title = `${NAMES[id]} ${STAGE_LABEL[st]}`;
      const classes = [];
      if (id === state.id && st === state.stage) classes.push("sel");
      if (state.fits[id]?.[st]) classes.push("edited");
      img.className = classes.join(" ");
      img.onclick = (e) => {
        e.stopPropagation();
        select(id, st);
      };
      row.append(img);
    }
    row.onclick = () => select(id, state.stage);
    el.append(row);
  }
}

function select(id: string, stage: Stage) {
  state.id = id;
  state.stage = FRAMES[id]?.[stage] ? stage : "awakened";
  if (state.grid) setGrid(false);
  list();
  paint();
}

// ───────────────────────── 오른쪽 조절 ─────────────────────────

let built = false;
const inputs: Record<string, { range: HTMLInputElement; num: HTMLInputElement }> = {};

function slider(parent: HTMLElement, key: string, label: string, min: number, max: number, step: number, on: (v: number) => void) {
  const row = document.createElement("label");
  row.className = "slider";
  const range = document.createElement("input");
  Object.assign(range, { type: "range", min, max, step });
  const num = document.createElement("input");
  Object.assign(num, { type: "number", min, max, step });
  range.oninput = () => on(Number(range.value));
  num.onchange = () => on(Number(num.value));
  row.append(label, range, num);
  parent.append(row);
  inputs[key] = { range, num };
}

function button(parent: HTMLElement, text: string, on: () => void) {
  const b = document.createElement("button");
  b.textContent = text;
  b.onclick = on;
  parent.append(b);
  return b;
}

function build() {
  const el = $("controls");
  el.innerHTML = `
    <h2 id="c-title"></h2>
    <div class="stages" id="c-stages"></div>
    <h3>큰 그림 (화면 위에서 끌면 이동, 휠로 크기)</h3>
    <div id="c-body"></div>
    <h3>띠 타일 얼굴 (아래 그림 위에서 끌면 이동, 휠로 크기)</h3>
    <div class="faces"><canvas id="face-s" width="${TILE_D}" height="${TILE_D}"></canvas><canvas id="face-l" width="120" height="120"></canvas></div>
    <canvas id="crop" width="300" height="300"></canvas>
    <div id="c-face"></div>
    <h3>비교</h3>
    <div><select id="c-ghost"></select></div>
    <p class="hint">다른 정령을 반투명하게 겹쳐 크기를 맞춰 봐요.</p>
    <h3>안내</h3>
    <p class="hint">초록 세로선은 가로 기준, 가로선은 성체·각성체 얼굴 높이(유체는 발밑)예요. 기준값은 얼굴 크기(성체·각성체)와 보이는 면적(유체)으로 처음 자리를 잡은 거예요.
    저장하면 <code>src/presentation/spiritFit.json</code>에 들어가고 열려 있는 게임 화면이 다시 불러와요.</p>`;
  const body = $("c-body");
  slider(body, "s", "크기", 0.4, 2.5, 0.01, (v) => setFit({ s: v }));
  slider(body, "dx", "가로", -500, 500, 1, (v) => setFit({ dx: v }));
  slider(body, "dy", "세로", -400, 400, 1, (v) => setFit({ dy: v }));
  const b1 = document.createElement("div");
  b1.className = "stages";
  button(b1, "큰 그림 되돌리기", () => setFit({ s: 1, dx: 0, dy: 0 }));
  button(b1, "이 단계 전부 되돌리기", () => setFit(null));
  body.append(b1);
  const face = $("c-face");
  slider(face, "cx", "가로", 0, 1, 0.001, (v) => setCrop(0, v));
  slider(face, "cy", "세로", 0, 1, 0.001, (v) => setCrop(1, v));
  slider(face, "cd", "크기", 0.02, 1.6, 0.001, (v) => setCrop(2, v));
  const b2 = document.createElement("div");
  b2.className = "stages";
  button(b2, "얼굴 되돌리기", () => {
    const f = { ...fitOf(state.id, state.stage) };
    delete f.c;
    replaceFit(f);
  });
  face.append(b2);
  const ghost = $<HTMLSelectElement>("c-ghost");
  ghost.innerHTML = `<option value="">겹쳐 보기 없음</option>` + IDS.flatMap((id) =>
    STAGES.filter((st) => FRAMES[id]?.[st]).map((st) => `<option value="${id}/${st}">${NAMES[id]} ${STAGE_LABEL[st]}</option>`)).join("");
  ghost.onchange = () => {
    state.ghost = ghost.value;
    paint();
  };
  cropEvents();
  built = true;
}

function crop(): Crop {
  return tileCrop(FRAMES[state.id]?.[state.stage], fitOf(state.id, state.stage)) ?? [0.5, 0.5, 1];
}
function setCrop(i: number, v: number) {
  const c = [...crop()] as [number, number, number];
  c[i] = r3(v);
  setFit({ c });
}

function controls() {
  if (!built) build();
  const { id, stage } = state;
  $("c-title").textContent = `${NAMES[id] ?? id} · ${STAGE_LABEL[stage]}`;
  const stages = $("c-stages");
  stages.innerHTML = "";
  for (const st of STAGES) {
    if (!FRAMES[id]?.[st]) continue;
    const b = button(stages, STAGE_LABEL[st], () => select(id, st));
    if (st === stage) b.classList.add("on");
  }
  const f = fitOf(id, stage);
  const c = crop();
  const values: Record<string, number> = { s: f.s ?? 1, dx: f.dx ?? 0, dy: f.dy ?? 0, cx: c[0], cy: c[1], cd: c[2] };
  for (const [k, v] of Object.entries(values)) {
    if (document.activeElement !== inputs[k].num) inputs[k].num.value = String(v);
    inputs[k].range.value = String(v);
  }
  $<HTMLSelectElement>("c-ghost").value = state.ghost;
  const im = image(id, stage);
  for (const [cid, d] of [["face-s", TILE_D], ["face-l", 120]] as const) {
    const cv = $<HTMLCanvasElement>(cid);
    const cc = cv.getContext("2d")!;
    cc.clearRect(0, 0, d, d);
    if (im) paintTileFace(cc, im, c, d);
  }
  paintCrop(im, c);
}

// 얼굴 자르기 편집: 그림 전체 위에 원
let cropView = { x: 0, y: 0, s: 1 };
function paintCrop(im: HTMLImageElement | undefined, c: Crop) {
  const cv = $<HTMLCanvasElement>("crop");
  const cc = cv.getContext("2d")!;
  cc.clearRect(0, 0, cv.width, cv.height);
  if (!im) return;
  const s = Math.min(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
  cropView = { x: (cv.width - im.naturalWidth * s) / 2, y: (cv.height - im.naturalHeight * s) / 2, s };
  cc.drawImage(im, cropView.x, cropView.y, im.naturalWidth * s, im.naturalHeight * s);
  const cx = cropView.x + c[0] * im.naturalWidth * s, cy = cropView.y + c[1] * im.naturalHeight * s, r = (c[2] * im.naturalHeight * s) / 2;
  cc.fillStyle = withAlpha(P.scrim, 0.5);
  cc.beginPath();
  cc.rect(0, 0, cv.width, cv.height);
  cc.arc(cx, cy, r, 0, Math.PI * 2, true);
  cc.fill();
  cc.strokeStyle = P.ok;
  cc.lineWidth = 2;
  cc.beginPath();
  cc.arc(cx, cy, r, 0, Math.PI * 2);
  cc.stroke();
}

function cropEvents() {
  const cv = $<HTMLCanvasElement>("crop");
  let from: { x: number; y: number; c: Crop } | null = null;
  const scale = () => cv.width / cv.getBoundingClientRect().width;
  cv.onpointerdown = (e) => {
    from = { x: e.clientX, y: e.clientY, c: crop() };
    cv.setPointerCapture(e.pointerId);
  };
  cv.onpointermove = (e) => {
    const im = image(state.id, state.stage);
    if (!from || !im) return;
    const k = scale() / cropView.s;
    const c: [number, number, number] = [
      r3(from.c[0] + ((e.clientX - from.x) * k) / im.naturalWidth),
      r3(from.c[1] + ((e.clientY - from.y) * k) / im.naturalHeight),
      from.c[2],
    ];
    setFit({ c });
  };
  cv.onpointerup = () => (from = null);
  cv.onwheel = (e) => {
    e.preventDefault();
    const c = [...crop()] as [number, number, number];
    c[2] = r3(Math.max(0.02, c[2] * (e.deltaY > 0 ? 1.04 : 1 / 1.04)));
    setFit({ c });
  };
}

// 큰 그림: 화면 위에서 끌면 이동, 휠로 크기
function viewEvents() {
  let from: { x: number; y: number; dx: number; dy: number } | null = null;
  const scale = () => FRAME.w / view.getBoundingClientRect().width;
  view.onpointerdown = (e) => {
    const f = fitOf(state.id, state.stage);
    from = { x: e.clientX, y: e.clientY, dx: f.dx ?? 0, dy: f.dy ?? 0 };
    view.setPointerCapture(e.pointerId);
    view.classList.add("drag");
  };
  view.onpointermove = (e) => {
    if (!from) return;
    const k = scale();
    setFit({ dx: Math.round(from.dx + (e.clientX - from.x) * k), dy: Math.round(from.dy + (e.clientY - from.y) * k) });
  };
  view.onpointerup = () => {
    from = null;
    view.classList.remove("drag");
  };
  view.onwheel = (e) => {
    e.preventDefault();
    const s = fitOf(state.id, state.stage).s ?? 1;
    setFit({ s: r3(s * (e.deltaY > 0 ? 1 / 1.02 : 1.02)) });
  };
}

// ───────────────────────── 나란히 보기 ─────────────────────────

function paintGrid() {
  const el = $("grid");
  el.innerHTML = "";
  const bar = document.createElement("div");
  bar.style.gridColumn = "1 / -1";
  bar.className = "stages";
  for (const st of STAGES) {
    const b = button(bar, STAGE_LABEL[st], () => {
      state.gridStage = st;
      paint();
    });
    if (st === state.gridStage) b.classList.add("on");
  }
  el.append(bar);
  const big = document.createElement("canvas");
  big.width = FRAME.w;
  big.height = FRAME.h;
  const bctx = big.getContext("2d")!;
  for (const id of IDS) {
    const st = state.gridStage;
    if (!FRAMES[id]?.[st]) continue;
    drawScreen(bctx, id, st, { guide: state.guide, ui: state.ui });
    const fig = document.createElement("figure");
    if (id === state.id && st === state.stage) fig.className = "sel";
    const small = document.createElement("canvas");
    small.width = FRAME.w / 2;
    small.height = FRAME.h / 2;
    small.getContext("2d")!.drawImage(big, 0, 0, small.width, small.height);
    const cap = document.createElement("figcaption");
    cap.textContent = `${NAMES[id]} ${STAGE_LABEL[st]}${state.fits[id]?.[st] ? " · 조정함" : ""}`;
    fig.append(small, cap);
    fig.onclick = () => select(id, st);
    el.append(fig);
  }
}

function setGrid(on: boolean) {
  state.grid = on;
  document.body.classList.toggle("grid", on);
  $("tab-grid").classList.toggle("on", on);
  $("tab-edit").classList.toggle("on", !on);
  if (on) state.gridStage = state.stage;
}

// ───────────────────────── 시작 ─────────────────────────

async function start() {
  await load();
  $("tab-edit").onclick = () => {
    setGrid(false);
    paint();
  };
  $("tab-grid").onclick = () => {
    setGrid(true);
    paint();
  };
  const check = (id: string, key: "closed" | "guide" | "ui") => {
    const el = $<HTMLInputElement>(id);
    el.onchange = () => {
      state[key] = el.checked;
      paint();
    };
  };
  check("opt-closed", "closed");
  check("opt-guide", "guide");
  check("opt-ui", "ui");
  $("save").onclick = save;
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      save();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (dirty()) e.preventDefault();
  });
  viewEvents();
  list();
  paint();
}

start();
