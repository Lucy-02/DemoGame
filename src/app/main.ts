// 렌더러 진입점. 플랫폼을 고르고 화면을 띄우는 일만 해요.
// 기본은 정본 기준 새 전투 화면(?scene=aim 처럼 고정 장면 고르기). ?screen=legacy 면 예전 임시 UI(디자인 확정 후 삭제 예정)를 띄워요.
import { getPlatform } from "../platform";
import { CURVE_RULES, type CurveRuleName } from "../presentation/aim/curve";
import { startGame } from "../presentation/game";
import { startPlaceholderGame } from "../presentation/placeholder";

async function start() {
  const platform = getPlatform();
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  const params = new URLSearchParams(location.search);
  const game = params.get("screen") === "legacy"
    ? await startPlaceholderGame("game")
    : await startGame("game", { hover: params.get("hover") ?? undefined, scene: params.get("scene") ?? undefined, curve: curveParam(params.get("curve")), lift: params.get("lift") ?? undefined });
  Object.assign(window, { game });
  if (platform.kind === "web") mountDevWindow(platform);
}

/** ?curve= 값이 알려진 조준선 규칙일 때만 넘겨요 */
function curveParam(v: string | null): CurveRuleName | undefined {
  return v !== null && v in CURVE_RULES ? (v as CurveRuleName) : undefined;
}

/** 브라우저 개발 화면에서 게임을 데스크톱 창처럼 보이게 하는 틀(index.html의 #dev-window)을 켜요. */
function mountDevWindow(platform: ReturnType<typeof getPlatform>) {
  document.body.classList.add("dev-window");
  document.querySelector("[data-dev=fullscreen]")?.addEventListener("click", () => platform.setFullscreen(true));
  document.querySelector("[data-dev=close]")?.addEventListener("click", () => document.body.classList.add("dev-closed"));
  document.querySelector("[data-dev=reopen]")?.addEventListener("click", () => document.body.classList.remove("dev-closed"));
}
start();
