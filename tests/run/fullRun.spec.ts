// 화면으로 한 판을 끝까지: 메인 → 출전 → 지도 → 전투 … → 보스 → 승리 결과 → 데모 끝 → 깃들기 → 메인 (0084 9번).
// 데모 범위(?demo, 0101)로 돌아요: 데모 끝 화면만 더 거치고 나머지 길은 같아요.
// 봇(tools/screenBot.ts)이 떠 있는 장면의 손잡이를 눌러요. 이길 때까지 판을 거듭하고, 장면 전환이 막히거나 콘솔 오류가 나면 실패해요.
import { expect, test } from "@playwright/test";

interface Tick { scene?: string; did?: string; runs: number; wins: number }

/** 같은 시드면 같은 판이에요 */
const SEED = 7;
/** 한 번은 거쳐야 하는 장면 */
const MUST = ["home", "depart", "map", "battle", "result", "event", "rest", "shop", "runEnd", "demoEnd", "join"];
const MAX_RUNS = 12;
/** 이만큼 아무것도 못 누르면 막힌 것으로 봐요 */
const STUCK_MS = 20_000;

test("화면으로 한 판을 끝까지 돌아요", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    // 못 불러온 파일은 아래에서 주소와 함께 적어요
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(`console: ${m.text()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`);
  });

  await page.goto(`/?demo&seed=${SEED}`);
  await expect(page.locator("#game canvas")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "game" in window && "session" in window);
  await page.evaluate(async () => {
    const bot = await import(/* @vite-ignore */ "/tools/screenBot.ts" as string);
    Object.assign(window, { __tick: bot.tick });
  });

  const seen = new Set<string>();
  const trail: string[] = [];
  let last = Date.now();
  let state: Tick = { runs: 0, wins: 0 };
  // 보스를 이기고 모든 장면을 거친 뒤 메인 화면으로 돌아올 때까지 판을 거듭해요
  while (!(state.wins > 0 && state.scene === "home" && MUST.every((k) => seen.has(k)))) {
    state = await page.evaluate(() => (window as unknown as { __tick: () => Tick }).__tick());
    expect(errors, trail.slice(-12).join(" → ")).toEqual([]);
    if (state.did) {
      last = Date.now();
      if (state.scene) seen.add(state.scene);
      trail.push(`${state.scene}:${state.did}`);
    } else {
      if (Date.now() - last > STUCK_MS) {
        await page.screenshot({ path: test.info().outputPath("stuck.png") });
        throw new Error(`막혔어요 (${state.scene ?? "장면 없음"}): ${trail.slice(-12).join(" → ")}`);
      }
      await page.waitForTimeout(15);
    }
    expect(state.runs, `이기지 못했거나 못 거친 장면이 있어요: ${MUST.filter((k) => !seen.has(k)).join(" · ")}`).toBeLessThanOrEqual(MAX_RUNS);
    if (state.did?.startsWith("판 결과 승리") || state.did?.startsWith("판 결과 패배")) await page.screenshot({ path: test.info().outputPath(`runEnd-${state.runs}.png`) });
  }

  console.log(`판 ${state.runs}번, 누름 ${trail.length}번, 거친 장면: ${[...seen].join(" · ")}`);
});
