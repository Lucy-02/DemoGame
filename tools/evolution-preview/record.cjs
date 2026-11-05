// 진화 연출 미리보기를 프레임 단위로 넘기며 영상으로 뽑아요. 느린 컴퓨터(소프트웨어 GL)에서도 박자가 밀리지 않아요.
// 쓰는 법: pnpm dev:web 을 켠 채로
//   node tools/evolution-preview/record.cjs <정령> <갈래> <출력 폴더> [fps] [초] [포트] [추가 쿼리 예: stage=bloom]
//   → <출력 폴더>/<정령>-<갈래>[-추가 쿼리].mp4 (ffmpeg 필요)
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync, rmSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

(async () => {
  const [, , spirit = "glass-salamander", branch = "1", out = "out/evolution", fps = "30", secs = "13", port = "5173", extra = ""] = process.argv;
  const tag = `${spirit}-${branch}${extra ? "-" + extra.replace(/[^a-z0-9]+/gi, "-") : ""}`;
  const dir = join(out, `${tag}-frames`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  // 트윈은 벽시계(Date.now)로 흘러가서, 프레임을 넘길 때 시계도 같이 넘겨요.
  await page.addInitScript(() => {
    const real = Date.now.bind(Date);
    let fake = null;
    Date.now = () => (fake === null ? real() : fake);
    window.__freeze = () => (fake = real());
    window.__advance = (ms) => (fake += ms);
  });
  await page.goto(`http://localhost:${port}/evolution-preview.html?spirit=${spirit}&branch=${branch}&capture=1&autoplay=1${extra ? "&" + extra : ""}`);
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).length > 0, null, { timeout: 60000 });
  await page.evaluate(() => { window.__game.loop.sleep(); window.__freeze(); });
  const n = Number(fps) * Number(secs);
  const dt = 1000 / Number(fps);
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate(([i, dt]) => {
      const g = window.__game;
      window.__advance(dt);
      g.step(performance.now() + i * dt, dt);
      return g.canvas.toDataURL("image/jpeg", 0.92);
    }, [i, dt]);
    writeFileSync(join(dir, `${String(i).padStart(4, "0")}.jpg`), Buffer.from(url.split(",")[1], "base64"));
  }
  await browser.close();
  const mp4 = join(out, `${tag}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", fps, "-i", join(dir, "%04d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", mp4]);
  console.log(mp4);
})();
