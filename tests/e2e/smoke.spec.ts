// Electron 스모크: 창이 뜨고, 게임 캔버스가 생기고, 저장이 실제 파일로 남는지 봐요.
import { _electron as electron, expect, test } from "@playwright/test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("앱이 뜨고 platform 저장이 파일로 남는다", async () => {
  const userData = await mkdtemp(join(tmpdir(), "demogame-e2e-"));
  // GPU 없는 CI에서도 WebGL이 돌게 소프트웨어 렌더러를 써요. 루트(컨테이너)에서는 샌드박스를 끌 수밖에 없어요.
  const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "."];
  if (process.getuid?.() === 0) args.unshift("--no-sandbox");
  const app = await electron.launch({ args, env: { ...process.env, DEMOGAME_USER_DATA: userData } });
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

    // 렌더러에는 Node가 없어야 해요.
    expect(await page.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe("undefined");
  } finally {
    await app.close();
  }
});
