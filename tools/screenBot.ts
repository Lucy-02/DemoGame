// 화면으로 한 판을 도는 봇 (0084 9번). 개발 서버의 페이지 안에서 불러 써요: `await import("/tools/screenBot.ts")`.
// 지금 떠 있는 장면을 보고 그 장면의 손잡이(버튼이 부르는 것과 같은 함수)를 한 번 눌러요. 전투의 판단은 tools/bot.ts의 smart가 해요.
// 화면 흐름(GameFlow)과 장면 전환을 실제로 거치고, 규칙은 세션을 통해서만 바뀌어요.
import type * as Phaser from "phaser";
import { maxHpOf } from "../src/core/stats";
import { Rng } from "../src/core/rng";
import type { GameSession } from "../src/session/game";
import { smartPlayTurn } from "./bot";

/** 장면의 안쪽 손잡이를 부르려고 형을 풀어요 (시험용) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

const RUNNING = 5;
const rng = new Rng(1);

export interface Tick {
  /** 맨 위에 떠 있는 장면 */
  scene?: string;
  /** 이번에 한 일. 없으면 기다리는 중 */
  did?: string;
  /** 끝난 판 수와 이긴 판 수 */
  runs: number;
  wins: number;
}

let wins = 0;
let seenOver = false;
/** 마지막으로 누른 프레임. 누른 것이 화면에 반영될 때까지 두 프레임 기다려요 */
let pressedAt = -10;
/** 가 본 칸 종류 */
const visited = new Set<string>();
/** 이번 턴 카드를 이미 놓은 전투 */
const placed = new WeakMap<object, number>();

function top(game: Phaser.Game): Loose | undefined {
  const all = game.scene.getScenes(true);
  // 만들어지는 중(불러오기 · create)인 장면이 하나라도 있으면 기다려요
  if (game.scene.getScenes(false).some((s) => s.sys.settings.status > 0 && s.sys.settings.status < RUNNING)) return undefined;
  return all[all.length - 1];
}

/** 한 번 눌러요. 누를 것이 없으면 did 없이 돌아와요 */
export function tick(): Tick {
  const w = window as unknown as { game: Phaser.Game; session: GameSession };
  const s = top(w.game);
  const out: Tick = { scene: s?.sys.settings.key, runs: w.session.garden.state.runs ?? 0, wins };
  if (!s || w.game.loop.frame - pressedAt < 2) return out;
  out.did = act(s, w.session);
  if (out.did) pressedAt = w.game.loop.frame;
  out.wins = wins;
  return out;
}

function act(s: Loose, game: GameSession): string | undefined {
  const key: string = s.sys.settings.key;
  if (key !== "runEnd") seenOver = false;
  switch (key) {
    case "home":
      s.onPrimary();
      return "떠나기";
    case "depart":
      s.onDepart(s.front);
      return "출전";
    case "map": {
      const run = game.run!.run;
      const options = run.reachable();
      const hp = run.spirits.reduce((a, x) => a + x.hp, 0) / run.spirits.reduce((a, x) => a + maxHpOf(x), 0);
      const heal = options.filter((n) => n.type === "rest" || n.type === "shop");
      const safe = options.filter((n) => n.type !== "elite");
      // 아직 안 가 본 종류의 칸을 먼저 가요 (모든 화면을 거치게)
      const fresh = options.filter((n) => !visited.has(n.type));
      const node = rng.pick(hp < 0.5 && heal.length ? heal : hp < 0.5 && safe.length ? safe : fresh.length ? fresh : options);
      visited.add(node.type);
      s.onEnter(node.id);
      return `지도 ${node.type}`;
    }
    case "battle": return battle(s);
    case "result": {
      const phase: string = s.phase;
      if (phase === "cards") {
        const card = s.vm.cards.length ? rng.pick(s.vm.cards as Loose[]) : undefined;
        s.take(card ? { card: s.vm.cards.indexOf(card), spirit: card.owners[0] } : "skip");
        return "보상 카드";
      }
      if (phase === "equip") {
        const [id, options] = Object.entries(s.vm.equip.takers as Record<string, Loose[]>)[0] ?? [];
        if (id) s.giveEquip(id, options[0]);
        else s.skipEquip();
        return "보상 장비";
      }
      return undefined;
    }
    case "rest": {
      if (s.session.canRest()) s.choose(0);
      else if (s.session.canUpgrade()) {
        s.session.dispatch({ kind: "upgrade", uid: s.session.upgradable()[0] });
        s.leave();
      } else s.leave();
      return "휴식";
    }
    case "event": {
      const st = s.session.step;
      if (st.kind === "choose") {
        const i = s.session.event.options.findIndex((_: unknown, j: number) => s.session.canChoose(j));
        s.session.choose(i);
      } else if (st.kind === "pick") s.session.pick(s.session.candidates(st.mode)[0]);
      s.advance();
      return `이벤트 ${st.kind}`;
    }
    case "shop":
      s.onLeave(s);
      return "상점";
    case "runEnd": {
      // 처음 보면 결과만 알리고(찍을 틈), 다음에 넘겨요
      if (!seenOver) {
        seenOver = true;
        if (game.lastRun?.victory) wins++;
        return game.lastRun?.victory ? "판 결과 승리" : "판 결과 패배";
      }
      s.data_.onGarden(s);
      return "판 결과 넘기기";
    }
    case "join": {
      if (s.picked === undefined) {
        s.select(0);
        s.confirm();
        return "깃들기 고르기";
      }
      s.onDone(s);
      return "깃들기 계속";
    }
  }
  return undefined;
}

function battle(s: Loose): string {
  const b = s.session.battle;
  // 턴 재생은 기다리지 않고 넘겨요
  if (s.playback) {
    s.step();
    return "재생";
  }
  const pick = s.vm.pick;
  if (pick) {
    s.picked(pick.kind === "fall" ? pick.cards.slice(0, pick.n).map((c: Loose) => c.key) : pick.picked);
    return `고르기 ${pick.kind}`;
  }
  if (s.session.over) {
    s.settle();
    return "전투 끝";
  }
  // smart 봇이 한 턴을 놓아요. 놓은 뒤의 연출 이벤트는 세션 명령과 같게 비우고, 놓인 모습을 한 번 그려요
  if (placed.get(b) !== b.turn) {
    placed.set(b, b.turn);
    smartPlayTurn(b, rng);
    b.drain();
    s.settle();
    return "카드 놓기";
  }
  s.endTurn();
  return `턴 ${b.turn}`;
}
