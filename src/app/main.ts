// 렌더러 진입점. 플랫폼을 고르고 화면을 띄우는 일만 해요.
// 기본은 정본 기준 새 전투 화면(?scene=aim 처럼 고정 장면 고르기). ?screen=spirits 는 정령 관리(?scene=fresh|mixed&select=&tab=&closed).
// ?screen=legacy 면 예전 임시 UI를 띄워요(새 화면이 규칙에 연결될 때마다 화면 단위로 지워요).
import { getPlatform } from "../platform";
import { startGame } from "../presentation/game";
import { startPlaceholderGame } from "../presentation/placeholder";

async function start() {
  const platform = getPlatform();
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  const params = new URLSearchParams(location.search);
  const screen = params.get("screen");
  const get = (k: string) => params.get(k) ?? undefined;
  const game = screen === "legacy"
    ? await startPlaceholderGame("game")
    : await startGame("game", {
      screen: screen === "spirits" ? "spirits" : "battle",
      hover: get("hover"), scene: get("scene"), lift: get("lift"), select: get("select"), tab: get("tab"), closed: params.has("closed"),
    });
  Object.assign(window, { game });
  if (platform.kind === "web") mountDevWindow(platform);
}

/** 브라우저 개발 화면에서 게임을 데스크톱 창처럼 보이게 하는 틀(index.html의 #dev-window)을 켜요. */
function mountDevWindow(platform: ReturnType<typeof getPlatform>) {
  document.body.classList.add("dev-window");
  document.querySelector("[data-dev=fullscreen]")?.addEventListener("click", () => platform.setFullscreen(true));
  document.querySelector("[data-dev=close]")?.addEventListener("click", () => document.body.classList.add("dev-closed"));
  document.querySelector("[data-dev=reopen]")?.addEventListener("click", () => document.body.classList.remove("dev-closed"));
}
start();
