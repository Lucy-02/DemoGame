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
// ?screen=join 은 깃들기(?scene=first|second&select=<후보 id>&hover=chip&taken=<후보 id>: 깃든 끝 상태).
// ?screen=depart 는 출전 준비(?scene=three|two&select=<앞열로 바꿀 정령 id>&hover=<정령 id>|strong).
// ?screen=menu 는 판 안 메뉴(?scene=menu|confirm&hover=settings|toHome|giveUp), ?screen=settings 는 설정 창(?hover=speed|shake). 둘 다 전투 고정 장면 위에 떠요.
// ?slow=4 는 모션을 4배 느리게 (어느 화면이든).
// ?screen=legacy 는 정원·저장 없이 바로 떠나는 시험 판(&party=a,b,c&adult&unlockAll&seed=). 칸마다 새 화면이 없으면 임시 장면이 맡아요.
import { C, SPIRITS } from "../core/data";
import { getPlatform } from "../platform";
import { startGame } from "../presentation/game";
import { GameSession } from "../session/game";
import { SettingsSession } from "../session/settings";

async function start() {
  const platform = getPlatform();
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  // 게임이 부모 크기를 재기 전에 창 틀을 씌워요
  if (platform.kind === "web") mountDevWindow(platform);
  const params = new URLSearchParams(location.search);
  const screen = params.get("screen");
  const get = (k: string) => params.get(k) ?? undefined;
  const fixture = screen === "battle" || screen === "spirits" || screen === "result" || screen === "shop" || screen === "home" || screen === "rest" || screen === "event" || screen === "runEnd" || screen === "deck" || screen === "map" || screen === "join" || screen === "depart" || screen === "menu" || screen === "settings" ? screen : undefined;
  const session = fixture ? undefined : screen === "legacy" ? trialSession(params) : await GameSession.load(platform);
  // 설정은 어느 화면이든 읽어요(소리 볼륨). 전체화면은 저장에 이어진 게임에서만 창에 입혀요: 설정이 정본이고, 창이 바뀌면(F11 · Esc) 설정이 따라가요 (0084 3 · 4번)
  const settings = await SettingsSession.load(platform);
  if (!fixture && screen !== "legacy") followFullscreen(platform, settings);
  Object.assign(window, { session, settings });
  const game = await startGame("game", {
    screen: fixture, session, settings, trial: screen === "legacy", quit: () => void platform.quit(),
    hover: get("hover"), scene: get("scene"), lift: get("lift"), select: get("select"), tab: get("tab"), closed: params.has("closed"), pick: params.has("pick"), taken: get("taken"),
    slow: Number(params.get("slow")) || undefined,
  });
  Object.assign(window, { game });
}

/** 시험 판: ?party=a,b,c 로 출전 정령(없으면 constants.default_party), ?adult 성체로, ?unlockAll 모든 카드, ?seed= 시드, ?acts=2 2막까지 */
function trialSession(params: URLSearchParams): GameSession {
  const ids = (params.get("party") ?? "").split(",").filter((id) => SPIRITS.some((s) => s.id === id));
  const party = ids.length ? ids : (C.default_party as string[]);
  const seed = Number(params.get("seed"));
  return GameSession.trial(
    { party, frontId: party.includes("glass_salamander") ? "glass_salamander" : party[0], adult: params.has("adult"), unlockAll: params.has("unlockAll"), ...(params.has("acts") ? { acts: Number(params.get("acts")) } : {}) },
    Number.isFinite(seed) && params.has("seed") ? () => seed : undefined,
  );
}

const SETTLE_MS = 400;

/** 설정의 전체화면 ↔ 실제 창. 켤 때 저장된 값을 입히고, 그 뒤로는 서로 따라가요 */
function followFullscreen(platform: ReturnType<typeof getPlatform>, settings: SettingsSession) {
  // 브라우저는 누르지 않은 전체화면 요청을 거절해요. 그때는 실제 창 상태를 따라요
  const apply = (on: boolean) => platform.setFullscreen(on).catch(() => sync());
  const sync = () => platform.isFullscreen().then((on) => settings.set({ fullscreen: on })).catch(() => {});
  settings.onChange((s, prev) => {
    if (s.fullscreen !== prev.fullscreen) void apply(s.fullscreen);
  });
  if (settings.state.fullscreen) void apply(true);
  // 창이 바뀌는 중에는 상태가 흔들려서, 잠잠해진 뒤에 한 번만 맞춰요
  let timer: number | undefined;
  const later = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void sync(), SETTLE_MS);
  };
  window.addEventListener("resize", later);
  document.addEventListener("fullscreenchange", later);
}

/** 브라우저 개발 화면에서 게임을 데스크톱 창처럼 보이게 하는 틀(index.html의 #dev-window)을 켜요. */
function mountDevWindow(platform: ReturnType<typeof getPlatform>) {
  document.body.classList.add("dev-window");
  document.querySelector("[data-dev=fullscreen]")?.addEventListener("click", () => void platform.setFullscreen(true));
  document.querySelector("[data-dev=close]")?.addEventListener("click", () => document.body.classList.add("dev-closed"));
  document.querySelector("[data-dev=reopen]")?.addEventListener("click", () => document.body.classList.remove("dev-closed"));
}
start();
