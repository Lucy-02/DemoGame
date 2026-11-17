// 판 안 메뉴 흐름 (0084 3~6번 · 0090): Esc와 톱니로 메뉴, 설정, 메인으로 나갔다 오기, 탐험 포기.
// 키와 마우스로 실제 화면을 눌러요. 전투 칸에 들어가는 것만 흐름의 손잡이를 불러요(지도 칸 자리는 시드마다 달라요).
import { expect, test, type Page } from "@playwright/test";
import type * as Phaser from "phaser";

const SEED = 7;
/** 1280×800 화면 좌표 */
const AT = {
  homePrimary: { x: 200, y: 300 }, homeSettings: { x: 200, y: 512 },
  gear: { x: 1247, y: 27 },
  menuSettings: { x: 640, y: 413 }, menuHome: { x: 640, y: 473 }, menuGiveUp: { x: 640, y: 541 },
  confirmGiveUp: { x: 740, y: 420 },
  shakeToggle: { x: 833, y: 490 }, speedFast: { x: 815, y: 553 },
};

interface Peek { active: string[]; phase?: string; last?: boolean; runs: number; shake?: boolean; speed?: string; saved: string | null }

const peek = (page: Page) => page.evaluate((): Peek => {
  const w = window as unknown as { game: Phaser.Game; session: { run?: { phase: { kind: string } }; lastRun?: { victory: boolean }; garden: { state: { runs?: number } } }; settings: { state: { shake: boolean; speed: string } } };
  return {
    active: w.game.scene.getScenes(true).map((s) => s.sys.settings.key).filter((k) => k !== "veil"),
    phase: w.session.run?.phase.kind, last: w.session.lastRun?.victory, runs: w.session.garden.state.runs ?? 0,
    shake: w.settings.state.shake, speed: w.settings.state.speed, saved: localStorage.getItem("demogame:settings"),
  };
});

/** 그 장면만 떠 있고 화면 전환 막이 걷힐 때까지 */
async function on(page: Page, key: string) {
  await expect.poll(async () => (await peek(page)).active, { timeout: 20_000 }).toEqual([key]);
  await page.waitForFunction(() => {
    const veil = (window as unknown as { game: Phaser.Game }).game.scene.getScene("veil") as unknown as { rect?: { input?: { enabled: boolean } } } | null;
    return !veil?.rect?.input?.enabled;
  });
  await page.waitForTimeout(250);
}

test("판 안 메뉴: 설정 · 메인으로 · 탐험 포기", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(`console: ${m.text()}`);
  });

  await page.goto(`/?seed=${SEED}`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/?seed=${SEED}`);
  const canvas = page.locator("#game canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "game" in window && "session" in window && "settings" in window);
  const box = (await canvas.boundingBox())!;
  // 누른 뒤 화면이 다시 그려질 틈을 줘요
  const click = async (p: { x: number; y: number }) => {
    await page.mouse.click(box.x + (p.x * box.width) / 1280, box.y + (p.y * box.height) / 800);
    await page.waitForTimeout(250);
  };

  // 메인 화면의 설정: 바꾸면 바로 저장돼요
  await on(page, "home");
  await click(AT.homeSettings);
  await on(page, "settings");
  await click(AT.shakeToggle);
  await click(AT.speedFast);
  await expect.poll(async () => (await peek(page)).saved).toContain('"speed":"fast"');
  expect((await peek(page)).shake).toBe(false);
  await page.keyboard.press("Escape");
  await on(page, "home");

  // 떠나서 지도: Esc로 열고 닫고, 톱니로 열어 설정까지 갔다 와요
  await click(AT.homePrimary);
  await on(page, "map");
  await page.keyboard.press("Escape");
  await on(page, "runMenu");
  await page.keyboard.press("Escape");
  await on(page, "map");
  await click(AT.gear);
  await on(page, "runMenu");
  await click(AT.menuSettings);
  await on(page, "settings");
  await page.keyboard.press("Escape");
  await on(page, "runMenu");
  await page.keyboard.press("Escape");
  await on(page, "map");

  // 전투에서 Esc → 메인으로 → 이어하기: 같은 전투가 다시 열려요
  await page.evaluate(() => {
    const w = window as unknown as { game: Phaser.Game; session: { run: { run: { reachable(): { id: string }[] } } } };
    (w.game.registry.get("legacyFlow") as { enter(id: string): void }).enter(w.session.run.run.reachable()[0].id);
  });
  await on(page, "battle");
  await page.keyboard.press("Escape");
  await on(page, "runMenu");
  await click(AT.menuHome);
  await on(page, "home");
  expect((await peek(page)).phase).toBe("battle");
  await click(AT.homePrimary);
  await on(page, "battle");

  // 탐험 포기: 확인 창에서 Esc는 메뉴로, 포기하면 패배 결과
  await page.keyboard.press("Escape");
  await on(page, "runMenu");
  await click(AT.menuGiveUp);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  expect((await peek(page)).active).toEqual(["runMenu"]);
  await click(AT.menuGiveUp);
  await click(AT.confirmGiveUp);
  await on(page, "runEnd");
  const end = await peek(page);
  expect(end.phase).toBeUndefined();
  expect(end.last).toBe(false);
  expect(end.runs).toBe(1);
  expect(errors).toEqual([]);
});
