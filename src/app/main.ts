// 렌더러 진입점. 플랫폼을 고르고 화면을 띄우는 일만 해요.
// 기본은 저장에 이어진 게임이에요: 메인 화면에서 판을 떠나 끝내고 돌아와요 (session/game.ts, presentation/flow.ts).
// 아래는 화면 하나를 고정 장면으로 여는 개발용이에요.
// ?screen=battle 은 정본 기준 새 전투 화면(?scene=aim 처럼 고정 장면 고르기). ?screen=spirits 는 정령 관리(?scene=fresh|mixed&select=&tab=&closed).
// ?screen=result 는 전투 결과(?scene=normal&hover=<카드 key|skip>&taken=<카드 key|skip>).
// ?screen=shop 은 상점(?scene=normal|poor&hover=<카드 id|heal>).
// ?screen=rest 는 휴식(?scene=normal|full&hover=rest|upgrade|upgrade:<카드 id>).
// ?screen=event 는 이벤트(?scene=<이벤트 id>&hover=<선택지 번호>|pick:<선택지 번호>).
// ?screen=runEnd 는 판 결과(?scene=victory|first|defeat). ?screen=demoEnd 는 데모 끝(?scene=garden|again).
// ?screen=home 은 타이틀 겸 메인 화면(?scene=first|full|running&hover=<줄 id>).
// ?screen=join 은 깃들기(?scene=first|second&select=<후보 id>&hover=chip&taken=<후보 id>: 깃든 끝 상태).
// ?screen=depart 는 출전 준비(?scene=three|two&select=<앞열로 바꿀 정령 id>&hover=<정령 id>|strong).
// ?screen=menu 는 판 안 메뉴(?scene=menu|confirm&hover=settings|toHome|giveUp), ?screen=settings 는 설정 창(?hover=speed|shake). 둘 다 전투 고정 장면 위에 떠요.
// ?screen=glossary 는 용어 모음 창(?hover=<용어 id>). 전투 고정 장면 위에 떠요.
// 개발 빌드에서만: window.session · window.game 으로 세션과 장면을 볼 수 있고(자동 점검 tools/screenBot.ts가 써요), ?seed= 로 새 판 · 새 정원의 시드를 고정해요.
// 데모 빌드(.env.demo의 VITE_DEMO=1, `pnpm dist:demo`)는 판의 범위를 데모로 묶고 데모 끝 화면을 켜요 (0101). 개발 빌드에서는 ?demo 로도 켜요.
// ?slow=4 는 모션을 4배 느리게 (어느 화면이든).
// ?res=2 는 그리는 해상도 배수를 고정 (없으면 모니터 크기로 골라요, presentation/style/resolution.ts).
// ?screen=legacy 는 정원·저장 없이 바로 떠나는 시험 판(&party=a,b,c&adult&unlockAll&seed=). 칸마다 새 화면이 없으면 임시 장면이 맡아요.
import { C, SPIRITS } from "../core/data";
import { getPlatform } from "../platform";
import { startGame } from "../presentation/game";
import { GameSession, demoScope } from "../session/game";
import { SettingsSession } from "../session/settings";
import { version } from "../../package.json";
import { installErrorLog } from "./errorLog";

const DEV = import.meta.env.DEV;

/** 개발용 ?seed=n: 시드를 n, n+1, … 순서로 줘요 (같은 판을 다시 돌릴 때) */
function devSeeds(params: URLSearchParams): (() => number) | undefined {
  let seed = Number(params.get("seed"));
  return params.has("seed") && Number.isFinite(seed) ? () => seed++ : undefined;
}

/** 버전 표시: 데모 빌드는 뒤에 -demo (메인 화면 구석 · 오류 기록) */
const versionOf = (demo: boolean) => (demo ? `${version}-demo` : version);

async function start() {
  const platform = getPlatform();
  const params = new URLSearchParams(location.search);
  const demo = import.meta.env.VITE_DEMO === "1" || (DEV && params.has("demo"));
  installErrorLog(platform, versionOf(demo));
  // 디버깅·e2e 테스트에서 콘솔로 접근할 수 있게 열어 둬요.
  Object.assign(window, { platform });
  // 게임이 부모 크기를 재기 전에 창 틀을 씌워요
  if (platform.kind === "web") mountDevWindow(platform);
  const screen = params.get("screen");
  const get = (k: string) => params.get(k) ?? undefined;
  const fixture = screen === "battle" || screen === "spirits" || screen === "result" || screen === "shop" || screen === "home" || screen === "rest" || screen === "event" || screen === "runEnd" || screen === "demoEnd" || screen === "deck" || screen === "map" || screen === "join" || screen === "depart" || screen === "menu" || screen === "settings" || screen === "glossary" ? screen : undefined;
  const session = fixture ? undefined : screen === "legacy" ? trialSession(params) : await GameSession.load(platform, DEV ? devSeeds(params) : undefined, demo ? demoScope() : {});
  // 설정은 어느 화면이든 읽어요(소리 볼륨). 전체화면은 저장에 이어진 게임에서만 창에 입혀요: 설정이 정본이고, 창이 바뀌면(F11 · Esc) 설정이 따라가요 (0084 3 · 4번)
  const settings = await SettingsSession.load(platform);
  if (!fixture && screen !== "legacy") followFullscreen(platform, settings);
  const game = await startGame("game", {
    screen: fixture, session, settings, trial: screen === "legacy", quit: () => void platform.quit(), version: versionOf(demo), demo,
    hover: get("hover"), scene: get("scene"), lift: get("lift"), stage: params.has("stage") ? Number(get("stage")) : undefined, select: get("select"), tab: get("tab"), closed: params.has("closed"), pick: params.has("pick"), taken: get("taken"),
    slow: Number(params.get("slow")) || undefined,
    res: Number(params.get("res")) || undefined,
  });
  // 시험용 문: 개발 빌드에서만 열어요
  if (DEV) Object.assign(window, { session, settings, game });
}

/** 시험 판: ?party=a,b,c 로 출전 정령(없으면 constants.default_party), ?adult 성체로, ?unlockAll 모든 카드, ?seed= 시드, ?acts=2 2막까지, ?start=3 3막에서 출발 */
function trialSession(params: URLSearchParams): GameSession {
  const ids = (params.get("party") ?? "").split(",").filter((id) => SPIRITS.some((s) => s.id === id));
  const party = ids.length ? ids : (C.default_party as string[]);
  const seed = Number(params.get("seed"));
  return GameSession.trial(
    { party, frontId: party.includes("glass_salamander") ? "glass_salamander" : party[0], adult: params.has("adult"), unlockAll: params.has("unlockAll"), ...(params.has("acts") ? { acts: Number(params.get("acts")) } : {}), ...(params.has("start") ? { startAct: Number(params.get("start")) } : {}) },
    Number.isFinite(seed) && params.has("seed") ? () => seed : undefined,
  );
}

const SETTLE_MS = 400;
/** 설정이 창을 바꾼 뒤 창이 따라올 때까지 기다려 주는 확인 횟수 (맥의 전체화면 전환은 1초쯤 걸려요) */
const FOLLOW_TRIES = 6;

/** 설정의 전체화면 ↔ 실제 창. 켤 때 저장된 값을 입히고, 그 뒤로는 서로 따라가요 */
function followFullscreen(platform: ReturnType<typeof getPlatform>, settings: SettingsSession) {
  // 설정이 창을 바꾸는 중이면 남은 확인 횟수. 그동안은 아직 안 바뀐 창 상태로 설정을 되돌리지 않아요(연달아 누를 때)
  let following = 0;
  let timer: number | undefined;
  // 창이 바뀌는 중에는 상태가 흔들려서, 잠잠해진 뒤에 한 번만 맞춰요
  const later = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void sync(), SETTLE_MS);
  };
  const sync = async () => {
    const on = await platform.isFullscreen().catch(() => undefined);
    if (on === undefined) return;
    if (on === settings.state.fullscreen) following = 0;
    else if (following > 0) {
      following--;
      later();
    } else settings.set({ fullscreen: on });
  };
  // 브라우저는 누르지 않은 전체화면 요청을 거절해요. 그때는 실제 창 상태를 따라요
  const apply = (on: boolean) => {
    following = FOLLOW_TRIES;
    later();
    return platform.setFullscreen(on).catch(() => {
      following = 0;
      return sync();
    });
  };
  settings.onChange((s, prev) => {
    if (s.fullscreen !== prev.fullscreen) void apply(s.fullscreen);
  });
  if (settings.state.fullscreen) void apply(true);
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
