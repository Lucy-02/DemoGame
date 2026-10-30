// 렌더러 진입점. 플랫폼을 고르고 화면을 띄우는 일만 해요.
import { getPlatform } from "../platform";
import { startPlaceholderGame } from "../presentation/placeholder";

async function start() {
  const platform = getPlatform();
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  const game = await startPlaceholderGame("game");
  Object.assign(window, { game });
}
start();
