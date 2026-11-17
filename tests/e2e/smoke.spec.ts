// Electron 스모크: 창이 뜨고, 게임 캔버스가 생기고, 저장과 오류 기록이 실제 파일로 남는지, 창 크기와 전체화면이 맞는지 봐요.
// 패키지된 앱을 보려면 DEMOGAME_EXE에 실행 파일 경로를 줘요 (`pnpm dist` 뒤, 예: release/mac-arm64/demogame.app/Contents/MacOS/demogame).
import { _electron as electron, expect, test, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function launch(): Promise<{ app: ElectronApplication; userData: string }> {
  const userData = await mkdtemp(join(tmpdir(), "demogame-e2e-"));
  // GPU 없는 CI에서도 WebGL이 돌게 소프트웨어 렌더러를 써요. 루트(컨테이너)에서는 샌드박스를 끌 수밖에 없어요.
  // 맥에서는 이 플래그가 WebGL을 깨뜨려서(ANGLE 초기화 실패) 리눅스에서만 써요.
  const args = process.platform === "linux" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [];
  if (process.getuid?.() === 0) args.unshift("--no-sandbox");
  const exe = process.env.DEMOGAME_EXE;
  const app = await electron.launch({ ...(exe ? { executablePath: exe, args } : { args: [...args, "."] }), env: { ...process.env, DEMOGAME_USER_DATA: userData } });
  return { app, userData };
}

test("앱이 뜨고 platform 저장이 파일로 남는다", async () => {
  const { app, userData } = await launch();
  try {
    const page = await app.firstWindow();
    await expect(page.locator("#game canvas")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: test.info().outputPath("title.png") });

    const kind = await page.evaluate(() => (window as unknown as { platform: { kind: string } }).platform.kind);
    expect(kind).toBe("electron");

    const roundTrip = await page.evaluate(async () => {
      const p = (window as unknown as { platform: { write(k: string, t: string): Promise<void>; read(k: string): Promise<string | null> } }).platform;
      await p.write("e2e", '{"ok":true}');
      return p.read("e2e");
    });
    expect(roundTrip).toBe('{"ok":true}');
    expect(await readFile(join(userData, "saves", "e2e.json"), "utf8")).toBe('{"ok":true}');

    // 오류 기록: 잡히지 않은 오류가 버전과 함께 파일에 남아요
    await page.evaluate(() => void setTimeout(() => { throw new Error("e2e 오류"); }));
    await expect.poll(() => readFile(join(userData, "logs", "error.log"), "utf8").catch(() => ""), { timeout: 5_000 }).toMatch(/v\d+\.\d+\.\d+(-demo)? error Error: e2e 오류/);

    // 렌더러에는 Node가 없어야 해요.
    expect(await page.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe("undefined");
  } finally {
    await app.close();
  }
});

/** 1280×800 화면 좌표: 메인 화면의 설정 줄, 설정 창의 전체화면 스위치 */
const AT = { homeSettings: { x: 200, y: 512 }, fullscreen: { x: 833, y: 444 } };
const BASE = { w: 1280, h: 800 };

const canvasBox = (page: Page) => page.evaluate(() => {
  const r = document.querySelector("#game canvas")!.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight };
});

/** 창이 바뀌는 동안(전체화면 전환)에는 화면 크기가 흔들려요. 잠잠해질 때까지 기다려요 */
async function settle(page: Page) {
  let prev = "";
  await expect.poll(async () => {
    const now = JSON.stringify(await canvasBox(page));
    const same = now === prev;
    prev = now;
    return same;
  }, { intervals: [500], timeout: 15_000 }).toBe(true);
}

test("창 크기를 바꾸면 비율을 지키며 늘고, 설정의 전체화면이 창을 바꾼다", async () => {
  const { app, userData } = await launch();
  const win = <T>(fn: (w: Electron.BrowserWindow, arg: number[]) => T, arg: number[] = []) =>
    app.evaluate(({ BrowserWindow }, [src, a]) => new Function("w", "arg", `return (${src})(w, arg)`)(BrowserWindow.getAllWindows()[0], a) as T, [fn.toString(), arg] as const);
  const saved = async () => JSON.parse(await readFile(join(userData, "saves", "settings.json"), "utf8").catch(() => "{}")) as { fullscreen?: boolean };
  try {
    const page = await app.firstWindow();
    await expect(page.locator("#game canvas")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    // 기준 크기로 열려요
    expect(await win((w) => w.getContentSize())).toEqual([BASE.w, BASE.h]);

    // 창 크기: 캔버스가 창 안에 가운데로, 16:10을 지키며 꽉 차요. 비율이 다른 창은 한쪽이 남아요(바닥색)
    for (const [w, h] of [[1600, 1000], [960, 600], [1000, 760]]) {
      await win((x, [cw, ch]) => x.setContentSize(cw, ch), [w, h]);
      await expect.poll(async () => (await canvasBox(page)).vw).toBe(w);
      await page.waitForTimeout(300);
      const c = await canvasBox(page);
      expect(c.w / c.h).toBeCloseTo(BASE.w / BASE.h, 2);
      expect(Math.max(c.w / c.vw, c.h / c.vh)).toBeCloseTo(1, 2);
      expect(c.x).toBeCloseTo((c.vw - c.w) / 2, 0);
      expect(c.y).toBeCloseTo((c.vh - c.h) / 2, 0);
    }
    await win((x, [cw, ch]) => x.setContentSize(cw, ch), [BASE.w, BASE.h]);
    await expect.poll(async () => (await canvasBox(page)).vw).toBe(BASE.w);

    // 설정 창의 전체화면 스위치를 실제로 눌러요: 창이 바뀌고 바로 저장돼요
    const click = async (p: { x: number; y: number }) => {
      const c = await canvasBox(page);
      await page.mouse.click(c.x + (p.x * c.w) / BASE.w, c.y + (p.y * c.h) / BASE.h);
    };
    await page.waitForTimeout(500);
    await click(AT.homeSettings);
    await page.waitForTimeout(800);
    await click(AT.fullscreen);
    await expect.poll(() => win((w) => w.isFullScreen()), { timeout: 10_000 }).toBe(true);
    await settle(page);
    await expect.poll(async () => (await saved()).fullscreen).toBe(true);
    // 창 관리자가 있는 곳(맥 · 윈도)에서는 화면을 채우고 비율을 지켜요
    if (process.platform !== "linux") {
      const c = await canvasBox(page);
      expect(c.vw).toBeGreaterThan(BASE.w);
      expect(c.w / c.h).toBeCloseTo(BASE.w / BASE.h, 2);
      await page.screenshot({ path: test.info().outputPath("fullscreen.png") });
    }
    await settle(page);
    await click(AT.fullscreen);
    await expect.poll(() => win((w) => w.isFullScreen()), { timeout: 10_000 }).toBe(false);
    await expect.poll(async () => (await saved()).fullscreen).toBe(false);

    // 창 쪽에서 바꾸면(F11 · 초록 단추) 설정이 따라가요
    if (process.platform !== "linux") {
      await page.waitForTimeout(2000);
      await win((w) => w.setFullScreen(true));
      await expect.poll(async () => (await saved()).fullscreen, { timeout: 10_000 }).toBe(true);
      await page.waitForTimeout(2000);
      await win((w) => w.setFullScreen(false));
      await expect.poll(async () => (await saved()).fullscreen, { timeout: 10_000 }).toBe(false);
    }
  } finally {
    await app.close();
  }
});
