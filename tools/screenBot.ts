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
  /** 지금 판의 막 */
  act?: number;
  /** 방금 끝난 판이 닿은 막 (판 결과를 처음 볼 때) */
  endedAct?: number;
  /** 지금 전투에 보이는 2막 규칙 (방전 칸 · 땅속 숨기) */
  marks?: string[];
}

let wins = 0;
let seenOver = false;
/** 마지막으로 누른 프레임. 누른 것이 화면에 반영될 때까지 두 프레임 기다려요 */
let pressedAt = -10;
/** 지도를 한 번 본 막 (찍을 틈) */
let lookedAct = 0;
/** 턴 재생을 빨리 감는 배수. 재생은 장면이 스스로 넘겨요 (봇이 넘기면 장면이 걸어 둔 걸음과 겹쳐요) */
const FAST = 12;
/** 봇이 놓은 카드로 끝나 봇이 닫은 전투 */
const closed = new WeakSet<object>();
/** 가 본 칸 종류 */
const visited = new Set<string>();
/** 누르기 하나. press = 버튼이 부르는 것과 같은 손잡이. again = 사람이 같은 버튼을 한 번 더 누를 수 있는 것 (봇의 판단 · 자동 진행은 아님) */
interface Press { did: string; press: () => void; again?: boolean }
/** 빠르게 두 번 누르기 (입력 안전 점검, 0099 4번): 누른 뒤 이 프레임 수만큼 지나 같은 버튼을 다시 눌러요 */
const AGAIN_AFTER = [1, 6];
let double = false;
let again: { scene: Loose; press: Press; left: number[]; from: number } | undefined;

/** 빠르게 두 번 누르기를 켜요 */
export function setDouble(on: boolean) {
  double = on;
}

/** 이번 턴 카드를 이미 놓은 전투 */
const placed = new WeakMap<object, number>();

/** 화면 전환 막(0086)이 덮고 있는 동안에는 사람도 못 눌러요 */
const veiled = (game: Phaser.Game) => !!(game.scene.getScene("veil") as Loose | null)?.rect?.input?.enabled;

function top(game: Phaser.Game): Loose | undefined {
  const veil = game.scene.getScene("veil") as Loose | null;
  if (veiled(game)) return undefined;
  const all = game.scene.getScenes(true).filter((s) => s !== veil);
  // 만들어지는 중(불러오기 · create)인 장면이 하나라도 있으면 기다려요
  if (game.scene.getScenes(false).some((s) => s !== veil && s.sys.settings.status > 0 && s.sys.settings.status < RUNNING)) return undefined;
  return all[all.length - 1];
}

/** 한 번 눌러요. 누를 것이 없으면 did 없이 돌아와요 */
export function tick(): Tick {
  const w = window as unknown as { game: Phaser.Game; session: GameSession };
  const frame = w.game.loop.frame;
  // 두 번 누르기: 사람이 누를 수 있는 동안(그 장면이 떠 있고 막이 없음)에만 같은 버튼을 다시 눌러요
  if (again) {
    const { scene, press, left, from } = again;
    if (frame - from < left[0]) return { scene: scene.sys.settings.key, runs: w.session.garden.state.runs ?? 0, wins };
    left.shift();
    if (!left.length) again = undefined;
    else again.from = frame;
    if (scene.sys.isActive() && !veiled(w.game)) {
      press.press();
      pressedAt = frame;
      return { scene: scene.sys.settings.key, did: `${press.did} (다시)`, runs: w.session.garden.state.runs ?? 0, wins };
    }
  }
  const s = top(w.game);
  const out: Tick = { scene: s?.sys.settings.key, runs: w.session.garden.state.runs ?? 0, wins };
  if (!s || frame - pressedAt < 2) return out;
  const p = act(s, w.session);
  if (!p) return out;
  p.press();
  pressedAt = frame;
  if (double && p.again) again = { scene: s, press: p, left: [...AGAIN_AFTER], from: frame };
  out.did = p.did;
  out.wins = wins;
  if (p.did.startsWith("판 결과 ") && p.did !== "판 결과 넘기기") out.endedAct = w.session.lastRun?.run.act;
  out.act = w.session.run?.run.act;
  if (s.sys.settings.key === "battle") {
    const b = s.session.battle;
    out.marks = [...(b.zones.length ? ["방전 칸"] : []), ...(b.aliveEnemies().some((e: Loose) => e.status.burrow?.n > 0) ? ["땅속 숨기"] : [])];
  }
  return out;
}

/** 판의 지금 상태를 한 줄로 (두 번 눌러도 같은 판이 되는지 견줘요) */
export function fingerprint(): string {
  const w = window as unknown as { session: GameSession };
  const run = w.session.run?.run;
  const g = w.session.garden.state;
  const garden = `${g.runs ?? 0}/${g.spirits.map((x) => `${x.id}:${x.exp}:${(x.equipment ?? []).map((e) => `${e.id}${e.resonance}`).join("+")}`).join(",")}`;
  if (!run) return garden;
  const spirits = run.spirits.map((x) => `${x.id}:${x.hp}:${x.equipment.map((e) => e.id).join("+")}`).join(",");
  return `${garden} | ${run.current?.id ?? "출발"} 골드 ${run.gold} | ${spirits} | ${run.deck.map((c) => c.cardId).sort().join(",")}`;
}

function act(s: Loose, game: GameSession): Press | undefined {
  const key: string = s.sys.settings.key;
  if (key !== "runEnd") seenOver = false;
  switch (key) {
    case "home": return { did: "떠나기", press: () => s.onPrimary(), again: true };
    case "depart": return { did: "출전", press: () => s.onDepart(s.front), again: true };
    case "map": {
      const run = game.run!.run;
      // 막마다 지도를 처음 보면 알리기만 해요 (찍을 틈)
      if (lookedAct !== run.act) {
        const act = run.act;
        return { did: `지도 보임 ${act}막`, press: () => { lookedAct = act; } };
      }
      const options = run.reachable();
      const hp = run.spirits.reduce((a, x) => a + x.hp, 0) / run.spirits.reduce((a, x) => a + maxHpOf(x), 0);
      const heal = options.filter((n) => n.type === "rest" || n.type === "shop");
      const safe = options.filter((n) => n.type !== "elite");
      // 아직 안 가 본 종류의 칸을 먼저 가요 (모든 화면을 거치게)
      const fresh = options.filter((n) => !visited.has(n.type));
      const node = rng.pick(hp < 0.5 && heal.length ? heal : hp < 0.5 && safe.length ? safe : fresh.length ? fresh : options);
      visited.add(node.type);
      return { did: `지도 ${node.type}`, press: () => s.onEnter(node.id), again: true };
    }
    case "battle": return battle(s);
    case "result": {
      const phase: string = s.phase;
      if (phase === "cards") {
        const card = s.vm.cards.length ? rng.pick(s.vm.cards as Loose[]) : undefined;
        const choice = card ? { card: s.vm.cards.indexOf(card), spirit: card.owners[0] } : "skip";
        return { did: "보상 카드", press: () => s.take(choice), again: true };
      }
      if (phase === "equip") {
        const [id, options] = Object.entries(s.vm.equip.takers as Record<string, Loose[]>)[0] ?? [];
        return { did: "보상 장비", press: () => (id ? s.giveEquip(id, options[0]) : s.skipEquip()), again: true };
      }
      return undefined;
    }
    case "rest": {
      // 쉬기를 고른 뒤 한 박자는 기다려요 (0089)
      if (s.rested) return undefined;
      if (s.session.canRest()) return { did: "휴식 쉬기", press: () => s.choose(0), again: true };
      if (s.session.canUpgrade()) {
        const uid = s.session.upgradable()[0];
        return { did: "휴식 강화", press: () => { if (s.session.dispatch({ kind: "upgrade", uid })) s.leave(); }, again: true };
      }
      return { did: "휴식 떠나기", press: () => s.leave(), again: true };
    }
    case "event": {
      const st = s.session.step;
      if (st.kind === "choose") {
        const i = s.session.event.options.findIndex((_: unknown, j: number) => s.session.canChoose(j));
        return { did: "이벤트 choose", press: () => { if (s.session.choose(i)) s.advance(); }, again: true };
      }
      if (st.kind === "pick") {
        const uid = s.session.candidates(st.mode)[0];
        return { did: "이벤트 pick", press: () => { if (s.session.pick(uid)) s.advance(); }, again: true };
      }
      return { did: `이벤트 ${st.kind}`, press: () => s.advance() };
    }
    case "shop": return { did: "상점", press: () => s.onLeave(s), again: true };
    case "runEnd": {
      lookedAct = 0;
      // 처음 보면 결과만 알리고(찍을 틈), 다음에 넘겨요
      if (!seenOver) {
        const victory = !!game.lastRun?.victory;
        return { did: victory ? "판 결과 승리" : "판 결과 패배", press: () => { seenOver = true; if (victory) wins++; } };
      }
      return { did: "판 결과 넘기기", press: () => s.data_.onGarden(s), again: true };
    }
    case "join": {
      if (s.picked === undefined) return { did: "깃들기 고르기", press: () => { s.select(0); s.confirm(); }, again: true };
      return { did: "깃들기 계속", press: () => s.onDone(s), again: true };
    }
  }
  return undefined;
}

function battle(s: Loose): Press | undefined {
  const b = s.session.battle;
  // 턴 재생은 장면이 스스로 넘겨요. 시계만 빨리 감아요
  if (s.playback) {
    s.time.timeScale = FAST;
    s.tweens.timeScale = FAST;
    return undefined;
  }
  const pick = s.vm.pick;
  if (pick) {
    const keys = pick.kind === "fall" ? pick.cards.slice(0, pick.n).map((c: Loose) => c.key) : pick.picked;
    return { did: `고르기 ${pick.kind}`, press: () => s.picked(keys), again: true };
  }
  // 봇이 놓은 카드로 전투가 끝났으면(카드를 화면으로 내면 장면이 닫아요) 한 번만 닫아요
  if (s.session.over) return closed.has(b) ? undefined : { did: "전투 끝", press: () => { closed.add(b); s.settle(); } };
  // smart 봇이 한 턴을 놓아요. 놓은 뒤의 연출 이벤트는 세션 명령과 같게 비우고, 놓인 모습을 한 번 그려요
  if (placed.get(b) !== b.turn) {
    return {
      did: "카드 놓기",
      press: () => {
        placed.set(b, b.turn);
        smartPlayTurn(b, rng);
        b.drain();
        s.settle();
      },
    };
  }
  const turn = b.turn;
  return { did: `턴 ${turn}`, press: () => s.endTurn(), again: true };
}
