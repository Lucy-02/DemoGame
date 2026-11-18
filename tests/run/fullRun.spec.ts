// 화면으로 한 판을 끝까지: 메인 → 출전 → 지도 → 전투 … → 1막 보스 → 막 넘기기 → 2막 … → 판 결과 → 깃들기 → 메인 (0084 9번 · 0099 4번).
// 봇(tools/screenBot.ts)이 떠 있는 장면의 손잡이를 눌러요. 막을 넘긴 판이 끝날 때까지 판을 거듭하고, 장면 전환이 막히거나 콘솔 오류가 나면 실패해요.
// 데모 범위(?demo, 0101: 2막까지)로 돌아요. 이긴 판은 판 결과 다음에 데모 끝 화면을 거쳐요.
// 같은 시드로 두 번 돌아요: 한 번씩 누르기, 그리고 누른 버튼을 빠르게 다시 누르기. 두 판의 상태가 칸마다 같아야 해요(같은 명령이 두 번 나가지 않음).
// 길이가 밸런스에 덜 흔들리게: 첫 판은 그대로 돌고, 그 뒤에는 정령을 다 키워 다시 켜요(둘째 판에 막을 넘겨요). 턴 재생은 전투마다 첫 턴만 끝까지 보고 나머지는 건너뛰어요.
// 판마다 걸린 시간과 장면마다 머문 시간을 콘솔에 남겨요.
import { expect, test, type Browser } from "@playwright/test";

interface Tick { scene?: string; did?: string; wait?: string; runs: number; wins: number; act?: number; endedAct?: number; marks?: string[] }

/** 같은 시드면 같은 판이에요 */
const SEED = 7;
/** 한 번은 거쳐야 하는 장면 */
const MUST = ["home", "depart", "map", "battle", "result", "event", "rest", "shop", "runEnd", "join", "2막 전투"];
const MAX_RUNS = 12;
/** 이만큼 판을 끝낸 뒤 정령을 다 키워요 */
const GROW_AFTER = 1;
/** 이만큼 아무것도 못 누르면 막힌 것으로 봐요 */
const STUCK_MS = 20_000;

async function play(browser: Browser, double: boolean, shot: (name: string) => string) {
  const page = await (await browser.newContext()).newPage();
  const name = double ? "두 번 누르기" : "한 번 누르기";
  const errors: string[] = [];
  // 어디서 났는지 보이게 스택도 적어요
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}\n${e.stack ?? ""}`));
  page.on("console", (m) => {
    // 못 불러온 파일은 아래에서 주소와 함께 적어요
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(`console: ${m.text()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`);
  });

  /** 게임이 뜨면 봇을 실어요 */
  const boot = async (waitAtHome: number) => {
    await expect(page.locator("#game canvas")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "game" in window && "session" in window);
    await page.evaluate(async ({ double, waitAtHome }) => {
      const bot = await import(/* @vite-ignore */ "/tools/screenBot.ts" as string);
      bot.setDouble(double);
      bot.setWaitAtHome(waitAtHome);
      Object.assign(window, { __tick: bot.tick, __fingerprint: bot.fingerprint, __grownSave: bot.grownSave });
    }, { double, waitAtHome });
  };
  await page.goto(`/?demo&seed=${SEED}`);
  await boot(GROW_AFTER);
  /**
   * 정령을 다 키워 저장하고 다시 켜요 (저장을 읽어 이어 가는 길도 거쳐요).
   * 첫 판(혼자 떠나 판 가운데 깃들기까지)은 그대로 돌고, 그 뒤 판은 키운 정령으로 1막을 넘겨요.
   */
  const grow = async () => {
    await page.evaluate(async () => {
      const w = window as unknown as { __grownSave(text: string): string; session: { flush(): Promise<void> }; platform: { read(key: string): Promise<string | null>; write(key: string, text: string): Promise<void> } };
      await w.session.flush();
      await w.platform.write("garden", w.__grownSave((await w.platform.read("garden"))!));
    });
    await page.reload();
    await boot(Infinity);
  };
  let grown = false;

  /** 메모리 두 숫자: JS 힙(MB)과 텍스처 수. 판을 돈 뒤 얼마나 늘었는지 기록에 남겨요 (docs/handoff/PERF_ANALYSIS.md) */
  const memory = () => page.evaluate(() => {
    const heap = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
    const game = (window as unknown as { game: { textures: { getTextureKeys(): string[] } } }).game;
    return { heapMb: heap ? Math.round(heap / 1e6) : undefined, textures: game.textures.getTextureKeys().length };
  });
  const memoryAtStart = await memory();

  const seen = new Set<string>();
  const marks = new Set<string>();
  const trail: string[] = [];
  /** 지도에서 칸을 고를 때마다의 판 상태 */
  const prints: string[] = [];
  let last = Date.now();
  let waitingFor: string | undefined;
  /** 가장 길게 아무 변화가 없던 시간 (기계가 얼마나 느린지 기록에 남겨요) */
  let longest = 0;
  let state: Tick = { runs: 0, wins: 0 };
  const tail = () => `${name}: ${trail.slice(-12).join(" → ")}`;
  /** 끝난 판 가운데 가장 멀리 간 막 */
  let reached = 0;
  /** 장면마다 머문 시간(ms)과 판마다 걸린 시간: 어디서 길어졌는지 기록에 남겨요 */
  const spent = new Map<string, number>();
  const began = Date.now();
  let runBegan = began;
  let at = began;
  // 막을 한 번 이상 넘긴 판이 끝나고(승리든 패배든, 0108) 모든 장면을 거친 뒤 메인 화면으로 돌아올 때까지 판을 거듭해요
  while (!(reached >= 2 && state.scene === "home" && MUST.every((k) => seen.has(k)))) {
    // 봇이 누른 것이 던진 오류에도 지나온 길을 붙여요
    state = await page.evaluate(() => (window as unknown as { __tick: () => Tick }).__tick()).catch((e: Error) => {
      throw new Error(`${tail()}\n${e.message}`);
    });
    expect(errors, tail()).toEqual([]);
    const now = Date.now();
    const where = state.scene === "battle" ? (state.wait?.includes("재생-") === false ? "battle 재생" : "battle") : (state.scene ?? "전환");
    spent.set(where, (spent.get(where) ?? 0) + now - at);
    at = now;
    // 누르지 않아도 기다리는 것이 바뀌면(턴 재생의 걸음, 전환 막, 장면 만들기) 나아가는 중이에요
    if (state.did || state.wait !== waitingFor) {
      longest = Math.max(longest, Date.now() - last);
      last = Date.now();
      waitingFor = state.wait;
    }
    // 봇이 메인 화면에서 기다리고 있으면 정령을 키울 차례예요
    if (!grown && state.runs >= GROW_AFTER && state.scene === "home" && !state.did) {
      grown = true;
      await grow();
      continue;
    }
    if (state.did) {
      if (state.scene) seen.add(state.scene);
      if (state.scene === "battle" && state.act === 2) seen.add("2막 전투");
      for (const m of state.marks ?? []) marks.add(m);
      reached = Math.max(reached, state.endedAct ?? 0);
      trail.push(`${state.scene}:${state.did}`);
      if (state.did.startsWith("지도 ") && !state.did.startsWith("지도 보임") && !state.did.endsWith("(다시)")) prints.push(await page.evaluate(() => (window as unknown as { __fingerprint: () => string }).__fingerprint()));
    } else {
      if (Date.now() - last > STUCK_MS) {
        await page.screenshot({ path: shot("stuck") });
        throw new Error(`막혔어요 (${state.scene ?? "장면 없음"}, ${state.wait}) ${tail()}`);
      }
      await page.waitForTimeout(15);
    }
    expect(state.runs, `${name}: 막을 넘긴 판이 없거나 못 거친 장면이 있어요: ${MUST.filter((k) => !seen.has(k)).join(" · ")}`).toBeLessThanOrEqual(MAX_RUNS);
    if (state.did === "판 결과 승리" || state.did === "판 결과 패배") {
      console.log(`${name}: 판 ${state.runs} ${state.endedAct}막에서 끝, ${((Date.now() - runBegan) / 60_000).toFixed(1)}분 (모두 ${((Date.now() - began) / 60_000).toFixed(1)}분)`);
      runBegan = Date.now();
    }
    if (state.did === "판 결과 승리" || state.did === "판 결과 패배") await page.screenshot({ path: shot(`runEnd-${state.runs}-${state.endedAct}막`) });
    if (state.did?.startsWith("지도 보임") && (state.act ?? 1) > 1) await page.screenshot({ path: shot(`map-${state.runs}-${state.act}막`) });
  }
  const memoryAtEnd = await memory();
  console.log(`${name}: 메모리 JS 힙 ${memoryAtStart.heapMb ?? "?"} → ${memoryAtEnd.heapMb ?? "?"}MB, 텍스처 ${memoryAtStart.textures} → ${memoryAtEnd.textures}개`);
  console.log(`${name}: 판 ${state.runs}번(가장 멀리 ${reached}막), 누름 ${trail.length}번(다시 ${trail.filter((t) => t.endsWith("(다시)")).length}번), 가장 긴 멈춤 ${(longest / 1000).toFixed(1)}초, 거친 장면: ${[...seen].join(" · ")}, 2막 규칙: ${[...marks].join(" · ") || "없음"}`);
  console.log(`${name}: 머문 시간(초) ${[...spent].sort((a, b) => b[1] - a[1]).map(([k, ms]) => `${k} ${Math.round(ms / 1000)}`).join(" · ")}`);
  await page.context().close();
  return prints;
}

test("화면으로 한 판을 끝까지 돌고, 빠르게 두 번 눌러도 같은 판이에요", async ({ browser }) => {
  const shot = (kind: string) => (name: string) => test.info().outputPath(`${kind}-${name}.png`);
  const [once, twice] = await Promise.all([play(browser, false, shot("once")), play(browser, true, shot("twice"))]);
  expect(twice).toEqual(once);
});
