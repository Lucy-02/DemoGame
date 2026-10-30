// 시각 검증: 정본 프레임과 Phaser 화면을 같은 1280×800으로 찍어 나란히·겹침·차이 이미지를 만들어요.
// 사용: pnpm visual [--crop x,y,w,h] [--frame rest] [--hover <카드 key>] [--scene aim] [--lift h1|b] [--lines trunk|side|focus|side-focus]
//   --hover: 정본 H1 프레임에서 그 카드에 마우스를 올린 상태와, 게임의 같은 호버 상태를 비교해요.
//   --scene aim: 정본 H1 프레임의 처음 상태(물방울 휘갈기기를 집어 거북 조준)와 게임 ?scene=aim 을 비교해요.
//   결과: test-results/visual/{canon,game,side,overlay,diff}.png (+ crop-*.png)
// 처음 한 번: pnpm exec playwright install chromium (맥·윈도우). GPU 없는 리눅스도 소프트웨어 WebGL로 돌아요.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "@playwright/test";
import { createServer } from "vite";

const W = 1280, H = 800;
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const hover = opt("hover");
const scene = opt("scene");
const frameId = opt("frame") ?? (hover || scene === "aim" ? "h1" : "rest");
const crop = opt("crop")?.split(",").map(Number) as [number, number, number, number] | undefined;
const outDir = resolve("test-results/visual");
mkdirSync(outDir, { recursive: true });

const orbitUrl = pathToFileURL(resolve("public/assets/fonts/Orbit-Regular.ttf")).href;

async function shootCanon(page: Page): Promise<Buffer> {
  await page.goto(pathToFileURL(resolve("design/canon/battle-r5/page.html")).href);
  // 정본은 Orbit을 Google Fonts에서 받아요. 오프라인에서도 같게 나오도록 번들 글꼴을 같은 이름으로 넣어요.
  await page.addStyleTag({ content: `@font-face{font-family:"Orbit";src:url("${orbitUrl}")}` });
  await page.evaluate(async () => {
    await document.fonts.load("16px Orbit", "가");
    await document.fonts.ready;
  });
  await page.evaluate(() => {
    (document.querySelector(".page") as HTMLElement).style.maxWidth = "none";
    document.querySelectorAll<HTMLElement>(".fw").forEach((w) => {
      w.style.width = "1280px";
      w.style.setProperty("--s", "1");
      w.style.borderRadius = "0";
    });
  });
  await page.mouse.move(1, 1);
  const el = await page.$(`#${frameId}`);
  if (!el) throw new Error(`정본에 #${frameId} 프레임이 없어요`);
  if (frameId !== "rest") {
    // H1~H3은 나란히 놓인 그림이라, 고른 프레임 말고는 숨겨서 겹치지 않게 해요
    await page.evaluate((f) => {
      document.querySelectorAll<HTMLElement>(".fig").forEach((fig) => {
        if (!fig.querySelector(`#${f}`)) fig.style.display = "none";
        else fig.style.gridColumn = "1 / -1";
      });
    }, frameId);
    if (hover) {
      await page.evaluate(({ f, k }) => {
        document.querySelector(`#${f} .cd[data-key="${k}"]`)?.dispatchEvent(new MouseEvent("mouseenter"));
      }, { f: frameId, k: hover });
    }
    await page.waitForTimeout(600);
  }
  return el.screenshot();
}

async function shootGame(page: Page, base: string): Promise<Buffer> {
  const q = new URLSearchParams();
  if (hover) q.set("hover", hover);
  if (scene) q.set("scene", scene);
  // 정본 H1 프레임과 비교할 땐 들기 크기도 정본 값으로 (게임 기본은 Lucy가 고른 b)
  const lift = opt("lift") ?? (frameId === "h1" ? "h1" : undefined);
  if (lift) q.set("lift", lift);
  const lines = opt("lines");
  if (lines) q.set("lines", lines);
  await page.goto(`${base}${q.size ? `?${q}` : ""}`);
  await page.waitForFunction(() => (window as { __screenReady?: string }).__screenReady === "battle", null, { timeout: 30_000 });
  await page.waitForTimeout(200);
  const canvas = await page.$("#game canvas");
  if (!canvas) throw new Error("게임 캔버스가 없어요");
  return canvas.screenshot();
}

/** 브라우저 캔버스로 두 이미지를 합성해요 (추가 의존성 없이). */
async function compose(page: Page, a: Buffer, b: Buffer) {
  await page.setContent("<canvas></canvas>");
  return page.evaluate(
    async ({ a, b, W, H, crop }) => {
      const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")!] as const; };
      const [ca, xa] = mk(W, H); xa.drawImage(ia, 0, 0);
      const [cb, xb] = mk(W, H); xb.drawImage(ib, 0, 0);
      const da = xa.getImageData(0, 0, W, H).data, db = xb.getImageData(0, 0, W, H).data;

      const [side, xs] = mk(W * 2, H); xs.drawImage(ca, 0, 0); xs.drawImage(cb, W, 0);
      const [over, xo] = mk(W, H); xo.drawImage(ca, 0, 0); xo.globalAlpha = 0.5; xo.drawImage(cb, 0, 0);
      const [diff, xd] = mk(W, H);
      const out = xd.createImageData(W, H);
      let bad = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        const gray = (da[i] + da[i + 1] + da[i + 2]) / 12;
        if (d > 24) { bad++; out.data.set([255, 0, 200, 255], i); } else out.data.set([gray, gray, gray, 255], i);
      }
      xd.putImageData(out, 0, 0);
      const png = (c: HTMLCanvasElement) => c.toDataURL("image/png");
      const res: Record<string, string | number> = { side: png(side), overlay: png(over), diff: png(diff), mismatch: bad / (W * H) };
      if (crop) {
        const [x, y, w, h] = crop;
        const z = 3;
        const [cc, xc] = mk(w * z * 2 + 8, h * z);
        xc.imageSmoothingEnabled = false;
        xc.drawImage(ca, x, y, w, h, 0, 0, w * z, h * z);
        xc.drawImage(cb, x, y, w, h, w * z + 8, 0, w * z, h * z);
        res.cropSide = png(cc);
        const [co, xco] = mk(w * z, h * z);
        xco.imageSmoothingEnabled = false;
        xco.drawImage(ca, x, y, w, h, 0, 0, w * z, h * z);
        xco.globalAlpha = 0.5;
        xco.drawImage(cb, x, y, w, h, 0, 0, w * z, h * z);
        res.cropOverlay = png(co);
      }
      return res;
    },
    { a: `data:image/png;base64,${a.toString("base64")}`, b: `data:image/png;base64,${b.toString("base64")}`, W, H, crop },
  );
}

const save = (name: string, dataUrl: string) =>
  writeFileSync(resolve(outDir, name), Buffer.from(dataUrl.split(",")[1], "base64"));

const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls!.local[0];
const browser = await chromium.launch({
  // 미리 설치된 크로미움을 쓰려면 CHROMIUM_PATH로 경로를 넘겨요.
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const ctx = await browser.newContext({ viewport: { width: W + 120, height: H + 120 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  // tsx(esbuild)가 함수 이름을 보존하려 넣는 __name 도우미를 브라우저 쪽에도 둬요.
  await ctx.addInitScript({ content: "window.__name = (f) => f;" });
  const page = await ctx.newPage();
  const canon = await shootCanon(page);
  const game = await shootGame(page, base);
  writeFileSync(resolve(outDir, "canon.png"), canon);
  writeFileSync(resolve(outDir, "game.png"), game);
  const r = await compose(page, canon, game);
  save("side.png", r.side as string);
  save("overlay.png", r.overlay as string);
  save("diff.png", r.diff as string);
  if (r.cropSide) save("crop-side.png", r.cropSide as string);
  if (r.cropOverlay) save("crop-overlay.png", r.cropOverlay as string);
  console.log(`차이 픽셀 ${(Number(r.mismatch) * 100).toFixed(2)}% → ${outDir}`);
} finally {
  await browser.close();
  await server.close();
}
