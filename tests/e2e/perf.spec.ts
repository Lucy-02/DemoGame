// 화면 쪽 성능 세 숫자 가운데 둘: 실행부터 첫 화면까지 걸린 시간, 전투 화면의 프레임 시간. (셋째인 한 판 뒤 메모리는 `pnpm test:run`이 찍어요.)
// 숫자는 기록만 해요: 결과 폴더의 perf.json과 콘솔. GPU 없는 CI(소프트웨어 렌더러)의 값은 기계 사이 비교에 못 써요.
// 실제 GPU가 있는 기계에서 DEMOGAME_PERF_BUDGET=1을 주면 스팀 덱 기준(800p 30fps = 프레임 33.4ms)을 넘는지도 봐요.
// 패키지된 앱은 DEMOGAME_EXE로 (smoke.spec.ts와 같아요).
import { _electron as electron, expect, test } from "@playwright/test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** 프레임 시간을 재는 동안 (ms) */
const SAMPLE_MS = 5_000;
/** 800p 30fps (Steam Deck 호환성 기준) */
const FRAME_BUDGET_MS = 1000 / 30;

test("첫 화면까지 걸린 시간과 전투 화면 프레임 시간을 기록해요", async () => {
  const userData = await mkdtemp(join(tmpdir(), "demogame-perf-"));
  const args = process.platform === "linux" || process.env.DEMOGAME_SOFTWARE_GL ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [];
  if (process.getuid?.() === 0) args.unshift("--no-sandbox");
  const exe = process.env.DEMOGAME_EXE;
  const t0 = Date.now();
  const app = await electron.launch({ ...(exe ? { executablePath: exe, args } : { args: [...args, "."] }), env: { ...process.env, DEMOGAME_USER_DATA: userData } });
  try {
    const page = await app.firstWindow();
    await expect(page.locator("#game canvas")).toBeVisible({ timeout: 30_000 });
    const firstScreenMs = Date.now() - t0;

    // 전투 고정 장면: 유닛 · 손패 · 순서표가 다 떠 있는 화면
    await page.goto(page.url().replace(/[?#].*$/, "") + "?screen=battle");
    await expect(page.locator("#game canvas")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2_000);
    const frames = await page.evaluate((ms) => new Promise<number[]>((done) => {
      const out: number[] = [];
      let prev = performance.now();
      const end = prev + ms;
      const step = (now: number) => {
        out.push(now - prev);
        prev = now;
        if (now < end) requestAnimationFrame(step);
        else done(out);
      };
      requestAnimationFrame(step);
    }), SAMPLE_MS);
    const sorted = [...frames].sort((a, b) => a - b);
    const at = (q: number) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] * 10) / 10;
    const result = { platform: process.platform, packaged: !!exe, softwareGl: args.some((a) => a.includes("swiftshader")), firstScreenMs, frameMs: { p50: at(0.5), p95: at(0.95), max: at(1) }, frames: frames.length };
    console.log(`성능: 첫 화면 ${firstScreenMs}ms, 전투 프레임 p50 ${result.frameMs.p50}ms · p95 ${result.frameMs.p95}ms · 최대 ${result.frameMs.max}ms (${frames.length}프레임${result.softwareGl ? ", 소프트웨어 렌더러" : ""})`);
    await writeFile(test.info().outputPath("perf.json"), JSON.stringify(result, null, 1));
    expect(frames.length).toBeGreaterThan(0);
    if (process.env.DEMOGAME_PERF_BUDGET) expect(result.frameMs.p95).toBeLessThanOrEqual(FRAME_BUDGET_MS);
  } finally {
    await app.close();
  }
});
