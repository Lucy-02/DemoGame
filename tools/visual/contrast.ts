// 글자 대비 재기: 고정 장면을 1280×800으로 찍고, 화면의 글자마다 글자색과 둘레 바탕색의 WCAG 대비를 재요.
// 색 값은 Lucy가 고르니 통과 · 실패를 가르지 않고 기준 아래 글자만 알려 줘요 (평가 P7-04 · P7-15).
// 사용: pnpm check:contrast [--min 4.5] [--screen shop]
//   결과: test-results/contrast/report.md (+ 화면 캡처)
// 재는 법: 글자 상자 둘레 한 줄의 가운데 색 = 바탕, 상자 안에서 바탕과 가장 먼 색(위 5% 지점) = 글자. 그림 위 글자는 바탕이 고르지 않아 낮게 나올 수 있어요.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Page } from "@playwright/test";
import { createServer } from "vite";

const W = 1280, H = 800;
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
/** 글자 대비 기준 (WCAG 2 AA 본문 4.5:1) */
const MIN = Number(opt("min") ?? 4.5);
const only = opt("screen");
const outDir = resolve("test-results/contrast");
mkdirSync(outDir, { recursive: true });

/** 재는 고정 장면: [이름, 주소 인자] */
const SCREENS: [string, string][] = [
  ["battle", ""], ["battle-crowded", "scene=crowded"], ["battle-order", "scene=order-plan"], ["battle-aim", "scene=aim"],
  ["spirits", "screen=spirits"], ["result", "screen=result"], ["shop", "screen=shop"], ["shop-poor", "screen=shop&scene=poor"],
  ["home", "screen=home"], ["rest", "screen=rest"], ["event", "screen=event"], ["runEnd", "screen=runEnd"], ["demoEnd", "screen=demoEnd"],
  ["deck", "screen=deck"], ["map", "screen=map"], ["join", "screen=join"], ["depart", "screen=depart"],
  ["menu", "screen=menu"], ["settings", "screen=settings"], ["glossary", "screen=glossary"],
];

interface Row { text: string; size: number; ratio: number; x: number; y: number }

async function measure(page: Page, shot: Buffer): Promise<Row[]> {
  return page.evaluate(async ({ src, W, H }) => {
    type Obj = { type: string; scrollFactorX: number; scrollFactorY: number; visible: boolean; alpha: number; list?: Obj[]; text?: string; style?: { fontSize: string }; getBounds(): { x: number; y: number; width: number; height: number }; parentContainer?: Obj };
    const game = (window as unknown as { game: { scene: { getScenes(active: boolean): { children: { list: Obj[] }; cameras: { main: { scrollX: number; scrollY: number } } }[] } } }).game;
    const texts: Obj[] = [];
    const walk = (o: Obj, shown: boolean) => {
      const on = shown && o.visible && o.alpha > 0;
      if (!on) return;
      if (o.type === "Text" && o.text?.trim()) texts.push(o);
      for (const c of o.list ?? []) walk(c, on);
    };
    // 맨 위 장면만 재요 (창 장면 아래에 깔린 화면은 일부러 어둡게 덮은 것)
    const top = game.scene.getScenes(true).filter((s) => s.children.list.length > 1).pop();
    if (!top) return [];
    for (const o of top.children.list) walk(o, true);
    const cam = top.cameras.main;

    const img = await new Promise<HTMLImageElement>((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const lin = (v: number) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    const lum = (i: number) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
    const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const rows: { text: string; size: number; ratio: number; x: number; y: number }[] = [];
    for (const t of texts) {
      const b = t.getBounds();
      // 스크롤하는 화면: 맨 바깥 부모의 스크롤 비율만큼 옮겨요
      let root = t;
      while (root.parentContainer) root = root.parentContainer;
      const sx = cam.scrollX * root.scrollFactorX, sy = cam.scrollY * root.scrollFactorY;
      const x0 = Math.floor(b.x - sx), y0 = Math.floor(b.y - sy), x1 = Math.ceil(b.x - sx + b.width), y1 = Math.ceil(b.y - sy + b.height);
      if (x0 < 1 || y0 < 1 || x1 >= W - 1 || y1 >= H - 1 || x1 - x0 < 2) continue;
      const ring: number[] = [];
      for (let x = x0 - 1; x <= x1; x++) ring.push(lum(((y0 - 1) * W + x) * 4), lum((y1 * W + x) * 4));
      for (let y = y0; y < y1; y++) ring.push(lum((y * W + x0 - 1) * 4), lum((y * W + x1) * 4));
      ring.sort((p, q) => p - q);
      const bg = ring[ring.length >> 1];
      const inside: number[] = [];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) inside.push(ratio(lum((y * W + x) * 4), bg));
      inside.sort((p, q) => q - p);
      // 획 한가운데 색: 가장 먼 값은 튀는 점일 수 있어서 위 5% 지점을 써요 (글자가 상자의 5%도 안 되면 가장 먼 값)
      const r = Math.max(inside[Math.floor(inside.length * 0.05)], inside[0] * 0.9);
      // 글자가 그 자리에 안 보여요 (따로 스크롤하는 카메라 안이거나 다른 것에 가려짐): 재지 않아요
      if (r < 1.1) continue;
      rows.push({ text: t.text!.replace(/\s+/g, " ").slice(0, 24), size: parseFloat(t.style?.fontSize ?? "0"), ratio: Math.round(r * 100) / 100, x: x0, y: y0 });
    }
    return rows;
  }, { src: `data:image/png;base64,${shot.toString("base64")}`, W, H });
}

async function main() {
  const server = await createServer({ server: { port: 0 }, logLevel: "error" });
  await server.listen();
  const base = server.resolvedUrls!.local[0];
  const browser = await chromium.launch({
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
    ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
  });
  const page = await (await browser.newContext({ viewport: { width: W + 120, height: H + 150 }, deviceScaleFactor: 1 })).newPage();
  // tsx가 함수 이름을 지키려고 끼워 넣는 도우미가 페이지 안에는 없어요
  await page.addInitScript("globalThis.__name = (f) => f");
  const lines = [`# 글자 대비 (기준 ${MIN}:1 아래만)`, "", "| 화면 | 글자 | 크기 | 대비 | 자리 |", "|---|---|---|---|---|"];
  let low = 0, all = 0;
  for (const [name, query] of SCREENS) {
    if (only && !name.startsWith(only)) continue;
    // 배수 1로 고정: 재는 좌표와 캡처 픽셀이 같아야 해요
    await page.goto(`${base}?${query}${query ? "&" : ""}res=1`);
    await page.waitForFunction(() => (window as { game?: { scene: { getScenes(a: boolean): unknown[] } } }).game?.scene.getScenes(true).length, undefined, { timeout: 30_000 });
    await page.waitForTimeout(1500);
    const canvas = await page.$("#game canvas");
    if (!canvas) throw new Error("게임 캔버스가 없어요");
    const shot = await canvas.screenshot();
    writeFileSync(resolve(outDir, `${name}.png`), shot);
    const rows = await measure(page, shot);
    all += rows.length;
    for (const r of rows.filter((r) => r.ratio < MIN).sort((a, b) => a.ratio - b.ratio)) {
      low++;
      lines.push(`| ${name} | ${r.text.replaceAll("|", "/")} | ${r.size}px | ${r.ratio.toFixed(2)} | ${r.x},${r.y} |`);
    }
  }
  await browser.close();
  await server.close();
  writeFileSync(resolve(outDir, "report.md"), `${lines.join("\n")}\n`);
  console.log(`글자 대비: ${all}개 가운데 ${MIN}:1 아래 ${low}개 (보고만 해요). ${resolve(outDir, "report.md")}`);
}

void main();
