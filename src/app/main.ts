// 렌더러 진입점. 플랫폼을 고르고 화면을 띄우는 일만 해요.
// 기본은 정본 기준 새 전투 화면. ?screen=legacy 면 예전 임시 UI(디자인 확정 후 삭제 예정)를 띄워요.
import { getPlatform } from "../platform";
import { startGame } from "../presentation/game";
import { startPlaceholderGame } from "../presentation/placeholder";

async function start() {
  const platform = getPlatform();
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  const params = new URLSearchParams(location.search);
  const game = params.get("screen") === "legacy"
    ? await startPlaceholderGame("game")
    : await startGame("game", { hover: params.get("hover") ?? undefined });
  Object.assign(window, { game });
}
start();
