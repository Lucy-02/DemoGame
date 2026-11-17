// 렌더러 진입점. 플랫폼을 고르고 화면을 띄우는 일만 해요.
// 기본은 저장에 이어진 게임이에요: 메인 화면에서 판을 떠나 끝내고 돌아와요 (session/game.ts, presentation/flow.ts).
// 아래는 화면 하나를 고정 장면으로 여는 개발용이에요.
// ?screen=battle 은 정본 기준 새 전투 화면(?scene=aim 처럼 고정 장면 고르기). ?screen=spirits 는 정령 관리(?scene=fresh|mixed&select=&tab=&closed).
// ?screen=result 는 전투 결과(?scene=normal&hover=<카드 key|skip>&taken=<카드 key|skip>).
// ?screen=shop 은 상점(?scene=normal|poor&hover=<카드 id|heal>).
// ?screen=rest 는 휴식(?scene=normal|full&hover=rest|upgrade|upgrade:<카드 id>).
// ?screen=event 는 이벤트(?scene=<이벤트 id>&hover=<선택지 번호>|pick:<선택지 번호>).
// ?screen=runEnd 는 판 결과(?scene=victory|first|defeat).
// ?screen=home 은 타이틀 겸 메인 화면(?scene=first|full|running&hover=<줄 id>).
// ?screen=legacy 는 정원·저장 없이 바로 떠나는 시험 판(&party=a,b,c&adult&unlockAll&seed=). 칸마다 새 화면이 없으면 임시 장면이 맡아요.
import { C, SPIRITS } from "../core/data";
import { getPlatform } from "../platform";
import { startGame } from "../presentation/game";
import { GameSession } from "../session/game";

async function start() {
  const platform = getPlatform();
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  const params = new URLSearchParams(location.search);
  const screen = params.get("screen");
  const get = (k: string) => params.get(k) ?? undefined;
  const fixture = screen === "battle" || screen === "spirits" || screen === "result" || screen === "shop" || screen === "home" || screen === "rest" || screen === "event" || screen === "runEnd" || screen === "deck" || screen === "map" ? screen : undefined;
  const session = fixture ? undefined : screen === "legacy" ? trialSession(params) : await GameSession.load(platform);
  Object.assign(window, { session });
  const game = await startGame("game", {
    screen: fixture, session, trial: screen === "legacy", quit: () => void platform.quit(),
    hover: get("hover"), scene: get("scene"), lift: get("lift"), select: get("select"), tab: get("tab"), closed: params.has("closed"), pick: params.has("pick"), taken: get("taken"),
  });
  Object.assign(window, { game });
  if (platform.kind === "web") mountDevWindow(platform);
}

/** 시험 판: ?party=a,b,c 로 출전 정령(없으면 constants.default_party), ?adult 성체로, ?unlockAll 모든 카드, ?seed= 시드 */
function trialSession(params: URLSearchParams): GameSession {
  const ids = (params.get("party") ?? "").split(",").filter((id) => SPIRITS.some((s) => s.id === id));
  const party = ids.length ? ids : (C.default_party as string[]);
  const seed = Number(params.get("seed"));
  return GameSession.trial(
    { party, frontId: party.includes("glass_salamander") ? "glass_salamander" : party[0], adult: params.has("adult"), unlockAll: params.has("unlockAll") },
    Number.isFinite(seed) && params.has("seed") ? () => seed : undefined,
  );
}

/** 브라우저 개발 화면에서 게임을 데스크톱 창처럼 보이게 하는 틀(index.html의 #dev-window)을 켜요. */
function mountDevWindow(platform: ReturnType<typeof getPlatform>) {
  document.body.classList.add("dev-window");
  document.querySelector("[data-dev=fullscreen]")?.addEventListener("click", () => platform.setFullscreen(true));
  document.querySelector("[data-dev=close]")?.addEventListener("click", () => document.body.classList.add("dev-closed"));
  document.querySelector("[data-dev=reopen]")?.addEventListener("click", () => document.body.classList.remove("dev-closed"));
}
start();
