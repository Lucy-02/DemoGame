// 헤드리스 런 시뮬레이터: 자동 플레이로 1막 한 판을 처음부터 보스까지 돌려요.
// 인카운터 하나만 보는 sim.ts와 달리 덱이 자라고 HP가 깎인 채 보스를 만나요.
// 사용: pnpm runsim [반복 수] [파티 a,b,c] [--adult] [--all] [--bot basic|smart|search|ladder] [--branch 정령:갈래,…] [--strong fire|forest|wind] [--acts 5] [--awakened]
//   판 단위 버릇만 바꿔 재기 (전투 봇은 그대로):
//     --reward default|any|skip|branch|only:카드id   보상 카드: 가려 받기(기본) · 아무거나 · 전부 넘기기 · 갈래부터 열기(0157) · 이 카드만
//     --path default|fight|avoid|elite|noelite 길: 기본 · 전투 먼저 · 전투 아닌 칸 먼저 · 정예 먼저 · 정예 피하기
//   표: --policies (보상 × 길 승률) · --cards (카드별 받은 판 승률 · 이 카드만 받기) · --floors (끝난 층) · --elites (정예 값) · --growth (판 안 성장: 막마다의 레벨 · 단계, 0157)
//   규칙을 바꾸지 않고 미리 재 보기: --whatif swap,noskipgold,earlyfights,upgraded,offer:3,start:3,winheal:10 (아래 WhatIf)
// 봇은 실력이 다른 셋이에요. 숫자는 절댓값이 아니라 봇 사이 · 바꾸기 전후 비교로 읽어요 (`design/canon/BALANCE_BASELINE.md` 7절).
//   basic  공격 카드부터 내고 보상은 아무거나 (골든 테스트와 같은 봇)
//   smart  한 장씩 값을 매겨 놓고, 보상 · 이벤트 · 빼기를 가려 골라요 (기본)
//   search 턴 안의 모든 순서를 돌려 보고 끝까지 굴려 고르는 탐색 봇 (느려요)
import { Battle } from "../src/core/battle";
import { C, CARDS, cardDef, spiritDef } from "../src/core/data";
import { freshSpirit } from "../src/core/growth";
import { Rng } from "../src/core/rng";
import { Run, type MapNode, type RewardCard } from "../src/core/run";
import { maxHpOf, returnHp } from "../src/core/stats";
import type { Element, EncounterDef, EventDef, Stage } from "../src/core/types";
import { tallyDeeds, type DeedTally } from "../src/session/deeds";
import { autoPlayTurn } from "./autoplay";
import { smartPlayTurn } from "./bot";
import { makeSearchBot, type Bot } from "./search";

const MAX_TURNS = 40;

export type BotKind = "basic" | "smart" | "search";

/** 보상 카드 버릇. default는 봇의 버릇(smart = 피해 · 화상만 받기) */
export type RewardMode = "default" | "any" | "skip" | "branch" | `only:${string}`;
/** 길 버릇. default는 HP가 낮을 때만 쉬는 곳을 찾고 아니면 아무 칸 */
export type PathMode = "default" | "fight" | "avoid" | "elite" | "noelite";
export const REWARD_MODES: RewardMode[] = ["default", "any", "skip"];
export const PATH_MODES: PathMode[] = ["fight", "default", "avoid"];

/**
 * 규칙 후보를 코어를 고치지 않고 시뮬레이터 안에서만 흉내 내요. 고른 뒤에 코어로 옮겨요.
 *   swap        보상 카드를 받으면 그 주인의 기본 카드 한 장이 빠져요 (공격 카드는 할퀴기, 아니면 막기와 바꿈)
 *   noskipgold  넘겨도 골드를 안 받아요
 *   earlyfights 막마다 2 · 3층이 모두 전투 칸이에요 (어느 길이든 전투 3번 이상)
 *   upgraded    보상 카드가 강화된 채로 와요
 *   offer:N     정령마다 N장씩 보여 줘요 (혼자 판의 "1장 받기 / 넘기기"를 넓힘)
 *   start:N     시작할 때 보상을 N번 먼저 골라요 (혼자 판의 시작 덱 장수)
 *   winheal:P   전투를 이기면 모두 최대 HP의 P%를 회복해요
 *   join:N      혼자 떠난 유체 판에 둘째 정령이 합류하는 층을 바꿔요 (0이면 처음부터). 규칙(0156)은 run_pool.join_floor층을 마친 뒤예요
 *   nojoin      혼자 떠난 판에 둘째 정령이 합류하지 않아요 (0156 전의 첫 판)
 *   cards:M     보상으로 나오는 카드(시작 덱에 없는 일반 · 고급 · 희귀)의 숫자를 M배 해요 (올림)
 *   foe:M       길 전투(잡몹 · 정예)의 적 피해를 M배 해요. 보스는 그대로
 *   mate:N      join과 같은 때에 정령 풀 밖의 임시 동료가 붙어요: 능력치 모두 기준값(10) · HP 20 · 무속성, 할퀴기 2 · 막기 2, 보상 카드 없음.
 *               코어에 없는 정령이라 안 쓰는 정령 정의 하나를 판 동안만 빌려 써요 (MATE_STAND_IN)
 */
export interface WhatIf { nojoin?: boolean; cards?: number; foe?: number; mate?: number; join?: number; swap?: boolean; noskipgold?: boolean; earlyfights?: boolean; upgraded?: boolean; offer?: number; start?: number; winheal?: number }

export interface SimOptions { reward?: RewardMode; path?: PathMode; whatif?: WhatIf }
export const BOT_KINDS: BotKind[] = ["basic", "smart", "search"];

/** 판 단위 판단: 보상 · 이벤트 · 카드 빼기 */
interface Policy {
  /** 받을 카드 id, 넘기면 null */
  reward(cards: RewardCard[], rng: Rng): string | null;
  event(run: Run, ev: EventDef, rng: Rng): number;
  /** 뺄 카드의 uid */
  remove(run: Run): number | undefined;
}

const has = (id: string, ...ops: string[]) => cardDef(id).effects.some((o) => ops.includes(o.op));

const NAIVE: Policy = {
  reward: (cards, rng) => rng.pick(cards).cardId,
  event: (_run, ev, rng) => Math.floor(rng.next() * ev.options.length),
  remove: (run) => (run.deck.find((c) => cardDef(c.cardId).rarity === "basic") ?? run.deck[0])?.uid,
};

/** 가려 고르기: 피해 · 화상 카드만 받고 아니면 넘겨요. 뺄 때는 막기 → 할퀴기 순서로, 화상 카드는 남겨요. */
const SENSIBLE: Policy = {
  reward: (cards, rng) => {
    const good = cards.filter((c) => has(c.cardId, "damage", "burn"));
    return good.length ? rng.pick(good).cardId : null;
  },
  event: (run, ev) => (ev.id === "ev_spring" ? (hpPct(run) < 0.85 ? 0 : 1) : ev.id === "ev_scroll" ? 1 : 0),
  remove: (run) => (run.deck.find((c) => c.cardId === "basic_block") ?? run.deck.find((c) => c.cardId === "basic_claw"))?.uid,
};

function player(kind: BotKind, seed: number): { bot: Bot; policy: Policy } {
  if (kind === "basic") return { bot: autoPlayTurn, policy: NAIVE };
  if (kind === "smart") return { bot: smartPlayTurn, policy: SENSIBLE };
  return { bot: makeSearchBot({ K: 3, top: 6, R: 8, depth: 30, rolloutBot: smartPlayTurn }, 12345 + seed), policy: SENSIBLE };
}

export interface RunSimResult {
  won: boolean;
  /** 끝난 곳: 인카운터 id 또는 "clear" */
  endedAt: string;
  floor: number;
  reachedBoss: boolean;
  /** 보스를 만났을 때의 덱 장수와 HP 비율 */
  bossDeck?: number;
  bossHpPct?: number;
  bossTurns?: number;
  battles: number;
  /** 잡몹 · 정예 전투의 턴 수 (이긴 전투와 진 전투 모두) */
  mobTurns: number[];
  eliteTurns: number[];
  /** 끝났을 때의 막, 넘긴 막 수 */
  act: number;
  actsCleared: number;
  /** 막마다 보스를 만났을 때의 HP 비율과 보스전 턴 수 */
  bosses: { act: number; hpPct: number; turns: number; won: boolean }[];
  /** 전투 보상에서 본 카드 · 받은 카드 · 넘긴 횟수 */
  offered: string[];
  taken: string[];
  skips: number;
  /** 보상 카드를 고른 막과 받았는지 (막별 받기 비율, 0132) */
  picks: { act: number; took: boolean }[];
  /** 판 안 성장 (0157): 키운 때(막 · 층 · 정령 · 단계)와 막 보스를 만났을 때의 레벨 · 단계 */
  grew: { act: number; floor: number; id: string; to: Stage }[];
  atBoss: { act: number; level: number; exp: number; stages: Stage[] }[];
  /** 끝난 칸의 종류 (클리어면 boss) */
  endedType: string;
  /** 들어간 칸 수 (종류별) */
  nodes: Record<string, number>;
}

const hpPct = (run: Run) => run.spirits.reduce((a, s) => a + s.hp, 0) / run.spirits.reduce((a, s) => a + maxHpOf(s), 0);

/** 전투 하나. 이기면 true. HP를 런에 되돌려요 (쓰러진 정령은 복귀 HP). deeds = 이 전투에서 센 자람 조건 */
function fight(run: Run, enc: EncounterDef, rng: Rng, bot: Bot, foe = 1): { won: boolean; turns: number; deeds: DeedTally } {
  const base = run.enemyScale();
  const scale = foe !== 1 && run.current?.type !== "boss" ? { hp: base?.hp ?? 1, dmg: (base?.dmg ?? 1) * foe } : base;
  const b = new Battle(run.spirits, run.battleDeck(), enc.enemies, run.frontId, rng, scale, run.battleTraits());
  b.firstGapBonus = run.battleGapBonus();
  const deeds: DeedTally = {};
  while (b.result === "ongoing" && b.turn < MAX_TURNS) {
    bot(b, rng);
    tallyDeeds(deeds, b.drain());
    if (b.result === "ongoing") b.endTurn();
    tallyDeeds(deeds, b.drain());
  }
  for (const s of b.spirits) run.spirit(s.id).hp = s.downed ? returnHp(run.spirit(s.id)) : s.hp;
  return { won: b.result === "victory", turns: b.turn, deeds };
}

const isFight = (n: MapNode) => n.type === "battle" || n.type === "elite";

/** 길 고르기: HP가 낮으면 휴식 · 상점을, 아니면 아무 칸이나. 정예는 HP가 넉넉할 때만. */
function pickNode(run: Run, rng: Rng, mode: PathMode = "default"): MapNode {
  const options = run.reachable();
  const first = (f: (n: MapNode) => boolean) => { const xs = options.filter(f); return xs.length ? rng.pick(xs) : undefined; };
  if (mode === "fight") return first(isFight) ?? rng.pick(options);
  if (mode === "avoid") return first((n) => !isFight(n)) ?? first((n) => n.type !== "elite") ?? rng.pick(options);
  if (mode === "elite") { const e = first((n) => n.type === "elite"); if (e) return e; }
  if (mode === "noelite") return first((n) => n.type !== "elite") ?? rng.pick(options);
  const low = hpPct(run) < 0.5;
  const safe = options.filter((n) => n.type !== "elite");
  const heal = options.filter((n) => n.type === "rest" || n.type === "shop");
  if (low && heal.length) return rng.pick(heal);
  if (low && safe.length) return rng.pick(safe);
  return rng.pick(options);
}

function removeOne(run: Run, policy: Policy) {
  const uid = policy.remove(run);
  if (uid !== undefined && run.deck.length > 5) run.removeCard(uid);
}

/** branches: 정령 id → 갈래. 갈래 고르기가 들어오기 전까지 무기 기술을 재는 데 써요 (0056) */
/** 임시 동료가 빌려 쓰는 정령 정의. 시작 풀 밖이라 혼자 판의 주인과 겹치지 않아요 */
const MATE_STAND_IN = "pearl_oyster";
const MATE = { element: "none", stats: { hp: 20, power: 10, guard: 10, focus: 10, speed: 10 } };

export function simulateRun(seed: number, kind: BotKind = "smart", party?: string[], adult = false, branches: Record<string, string> = {}, strong?: Element, acts?: number, awakened = false, sim: SimOptions = {}): RunSimResult {
  const undo: (() => void)[] = [];
  if (sim.whatif?.mate !== undefined && !party?.includes(MATE_STAND_IN)) {
    const def = spiritDef(MATE_STAND_IN), kept = { element: def.element, stats: def.stats };
    Object.assign(def, MATE);
    undo.push(() => Object.assign(def, kept));
  }
  const m = sim.whatif?.cards;
  if (m && m !== 1) for (const c of CARDS) {
    if (c.start || c.startEach || c.rarity === "basic" || (c.obtain ?? "reward") !== "reward") continue;
    for (const e of c.effects as { value?: number }[]) if (typeof e.value === "number") { const v = e.value; e.value = Math.ceil(v * m); undo.push(() => { e.value = v; }); }
  }
  try { return simulate(seed, kind, party, adult, branches, strong, acts, awakened, sim); } finally { for (const f of undo) f(); }
}

function simulate(seed: number, kind: BotKind, party: string[] | undefined, adult: boolean, branches: Record<string, string>, strong: Element | undefined, acts: number | undefined, awakened: boolean, sim: SimOptions): RunSimResult {
  const wi = sim.whatif ?? {};
  const ids = party ?? (C.default_party as string[]);
  // 앞열은 가장 튼튼한 정령(HP + 방어)에게 맡겨요. 앞열을 잘못 세우면 같은 파티도 보스를 못 넘어요.
  const sturdy = (id: string) => { const st = spiritDef(id).stats; return st.hp + st.guard * 2; };
  const frontId = [...ids].sort((a, z) => sturdy(z) - sturdy(a))[0];
  // 기본은 유체 Lv1로 떠나 판 안에서 자라요 (0157). --adult · --awakened는 그 단계의 문 레벨에서 시작해 뒤 막만 따로 재요
  const run = new Run({ seed: 5000 + seed, frontId, party, adult, awakened, unlockAll: false, strongElement: strong, acts });
  if (adult || awakened) for (const s of run.spirits) s.branch ??= branches[s.id];
  const grew: RunSimResult["grew"] = [];
  const atBoss: RunSimResult["atBoss"] = [];
  // 키울 수 있으면 바로 키워요. 갈래는 --branch로 정한 것이 열렸으면 그것, 아니면 열린 것 가운데 첫째
  const growAll = () => {
    for (const id of run.evolvable()) {
      const open = run.evolveChoices(id).filter((c) => c.ok);
      const pick = open.find((c) => c.evo.branch === branches[id]) ?? open[0];
      if (run.evolve(id, pick.evo.branch)) grew.push({ act: run.act, floor: run.current?.floor ?? 0, id, to: pick.evo.to });
    }
  };
  // 전투와 판 단위 판단의 난수를 나눠요. 봇이 달라도 같은 시드면 같은 지도 · 같은 길 고르기 난수를 써요.
  const battleRng = new Rng(seed * 13 + 5);
  const rng = new Rng(seed * 31 + 7);
  const { bot, policy } = player(kind, seed);
  let battles = 0;
  const mobTurns: number[] = [], eliteTurns: number[] = [];
  const bosses: RunSimResult["bosses"] = [];
  const offered: string[] = [], taken: string[] = [];
  const nodes: Record<string, number> = {};
  let skips = 0;
  const picks: RunSimResult["picks"] = [];
  const mode = sim.reward ?? "default";
  const choose = (cards: RewardCard[]): string | null => {
    if (mode === "skip") return null;
    if (mode === "any") return rng.pick(cards).cardId;
    if (mode.startsWith("only:")) return cards.find((c) => c.cardId === mode.slice(5))?.cardId ?? null;
    if (mode === "branch") {
      // 갈래가 아직 하나도 안 열린 유체의 갈래 카드를 먼저 받아요 (갈래 조건에 가장 가까운 것부터). 없으면 봇의 버릇대로
      const need = cards.flatMap((c) => {
        const branch = cardDef(c.cardId).branch;
        const s = run.spirit(c.owner);
        if (!branch || s.stage !== "baby") return [];
        const choices = run.evolveChoices(c.owner);
        if (choices.some((x) => x.open)) return [];
        const have = run.receivedBy(c.owner).filter((id) => cardDef(id).branch === branch).length;
        return [{ id: c.cardId, have }];
      }).sort((a, z) => z.have - a.have);
      if (need.length) return need[0].id;
    }
    return policy.reward(cards, rng);
  };
  // 막마다 2 · 3층을 전투 칸으로 (whatif earlyfights)
  const shapeMap = () => { if (wi.earlyfights) for (const n of run.map.values()) if (n.floor === 2 || n.floor === 3) n.type = "battle"; };
  shapeMap();
  const takeReward = (reward: ReturnType<Run["rollBattleReward"]>) => {
    if (wi.mate !== undefined) { reward.cards = reward.cards.filter((c) => c.owner !== MATE_STAND_IN); reward.cardsDone ||= reward.cards.length === 0; }
    if (!reward.cardsDone) {
      for (let i = 1; i < (wi.offer ?? 1); i++) for (const c of run.rollSpiritCards(C.reward[reward.kind === "elite" ? "rarity_elite" : "rarity_normal"])) if (!reward.cards.some((o) => o.cardId === c.cardId)) reward.cards.push(c);
      offered.push(...reward.cards.map((c) => c.cardId));
      const id = choose(reward.cards);
      picks.push({ act: run.act, took: !!id });
      if (id) {
        const owner = reward.cards.find((c) => c.cardId === id)!.owner;
        run.takeRewardCard(reward, id);
        taken.push(id);
        const got = run.deck[run.deck.length - 1];
        if (wi.upgraded && run.canUpgrade(got.uid)) run.upgradeCard(got.uid);
        if (wi.swap) {
          const out = run.deck.find((c) => c.owner === owner && c.cardId === (has(id, "damage", "burn") ? "basic_claw" : "basic_block"))
            ?? run.deck.find((c) => c.owner === owner && cardDef(c.cardId).rarity === "basic");
          if (out) run.removeCard(out.uid);
        }
      } else {
        run.skipRewardCards(reward);
        skips++;
        if (wi.noskipgold) run.gold -= reward.skipGold;
      }
    }
    if (reward.equipment && !reward.equipDone) {
      // 받을 수 있는 정령 중 하나에게. 칸이 꽉 찼으면 먼저 지닌 것을 내려놓아요
      const equipId = reward.equipment.equipId;
      const taker = rng.pick(run.equipTakers(equipId));
      run.giveRewardEquipment(reward, taker.id, run.needsReplace(equipId, taker.id) ? taker.equipment[0].id : undefined);
    }
  };
  for (let i = 0; i < (wi.start ?? 0); i++) { const r = run.rollBattleReward("battle"); run.gold -= r.gold; takeReward(r); }
  // 둘째 정령 합류 (0156): 혼자 떠난 유체 판은 정한 층을 마치면 시작 풀의 다른 정령 하나가 유체 · 시작 덱으로 합류해요 (Run.addSpirit)
  const soloBaby = run.spirits.length === 1 && !adult && !awakened;
  const joinAt = wi.mate ?? wi.join ?? (soloBaby && !wi.nojoin ? (C.run_pool.join_floor as number) : undefined);
  let joined = joinAt === undefined || run.spirits.length !== 1;
  const join = () => {
    joined = true;
    const def = wi.mate !== undefined ? spiritDef(MATE_STAND_IN) : spiritDef(new Rng(seed * 7 + 3).pick((C.start_pool as string[]).filter((id) => id !== run.spirits[0].id)));
    const first = run.spirits[0];
    const mate = { ...freshSpirit(def.id, first.personality), stage: first.stage, exp: first.exp, level: first.level };
    if (wi.mate === undefined) return run.addSpirit(mate);
    mate.hp = maxHpOf(mate);
    run.spirits.push(mate);
    for (const id of ["basic_claw", "basic_claw", "basic_block", "basic_block"]) run.addCard(id, def.id);
  };
  if (!joined && joinAt === 0) join();
  for (let guard = 0; guard < 30 * run.lastAct; guard++) {
    if (!joined && run.act === 1 && (run.current?.floor ?? 0) >= joinAt!) join();
    const node = pickNode(run, rng, sim.path);
    run.enter(node);
    nodes[node.type] = (nodes[node.type] ?? 0) + 1;
    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      const enc = run.pickEncounter(node.type);
      const before = { bossDeck: run.deck.length, bossHpPct: hpPct(run) };
      if (node.type === "boss") atBoss.push({ act: run.act, level: Math.max(...run.spirits.map((s) => s.level)), exp: Math.max(...run.spirits.map((s) => s.exp)), stages: run.spirits.map((s) => s.stage) });
      const { won, turns, deeds } = fight(run, enc, battleRng, bot, wi.foe);
      battles++;
      if (node.type === "battle") mobTurns.push(turns);
      else if (node.type === "elite") eliteTurns.push(turns);
      if (node.type === "boss") bosses.push({ act: run.act, hpPct: before.bossHpPct, turns, won });
      const tail = { battles, mobTurns, eliteTurns, act: run.act, actsCleared: run.act - (won && node.type === "boss" ? 0 : 1), bosses, offered, taken, skips, picks, nodes, endedType: node.type, grew, atBoss };
      if (node.type === "boss" && !(won && run.hasNextAct())) return { won, endedAt: won ? "clear" : enc.id, floor: node.floor, reachedBoss: true, ...before, bossTurns: turns, ...tail };
      if (!won) return { won: false, endedAt: enc.id, floor: node.floor, reachedBoss: bosses.length > 0, ...tail };
      // 이긴 전투의 경험 · 자람 조건을 받고(0157), 보상을 고른 뒤 키울 수 있으면 키워요 (화면의 순서와 같아요)
      run.grantBattle(node.type === "battle" ? "normal" : node.type, deeds);
      takeReward(run.rollBattleReward(node.type === "boss" ? "elite" : node.type));
      growAll();
      if (wi.winheal) run.healAllPct(wi.winheal / 100);
      if (node.type === "boss") { run.nextAct(); shapeMap(); }
    } else if (node.type === "rest") {
      run.healAllPct(C.rest_heal_pct as number);
    } else if (node.type === "shop") {
      const shop = C.shop as { heal_price: number; heal_pct: number };
      if (hpPct(run) < 0.7 && run.gold >= shop.heal_price) {
        run.gold -= shop.heal_price;
        run.healAllPct(shop.heal_pct);
      }
      if (run.gold >= run.removePrice()) {
        run.gold -= run.removePrice();
        run.removals++;
        removeOne(run, policy);
      }
    } else if (node.type === "event") {
      const ev = run.pickEvent();
      for (const o of ev.options[policy.event(run, ev, rng)].outcome) {
        if (o.type === "healPct") run.healAllPct(o.value);
        else if (o.type === "gold") run.gold += o.value;
        else if (o.type === "damageAll") for (const s of run.spirits) s.hp = Math.max(1, s.hp - o.value);
        else if (o.type === "damageFront") run.spirit(run.frontId).hp = Math.max(1, run.spirit(run.frontId).hp - o.value);
        else if (o.type === "maxHpAll") for (const s of run.spirits) { s.maxHpBonus += o.value; s.hp = Math.min(maxHpOf(s), s.hp + o.value); }
        else if (o.type === "cardReward") {
          const cards = run.rollCards(3, C.reward.rarity_normal as Record<string, number>, o.rarity);
          if (cards.length) { const c = rng.pick(cards); run.addCard(c.id, rng.pick(run.learnersOf(c.id)).id); }
        } else if (o.type === "removeCard") removeOne(run, policy);
        else if (o.type === "upgradeCard" || o.type === "duplicateCard") {
          // 피해 · 화상 카드 가운데 하나를 골라요
          const good = run.deck.filter((c) => has(c.cardId, "damage", "burn") && (o.type === "duplicateCard" || run.canUpgrade(c.uid)));
          if (good.length) { const c = rng.pick(good); if (o.type === "upgradeCard") run.upgradeCard(c.uid); else run.duplicateCard(c.uid); }
        } else run.applyMark(o);
      }
    }
  }
  throw new Error("런이 끝나지 않았어요");
}

/** 승률의 95% 구간 (Wilson) */
export function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), h = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - h) / d, (c + h) / d];
}

/** 한 번 재는 조건. 표들이 같은 조건에서 버릇만 바꿔 다시 돌려요 */
interface Setup { n: number; kind: BotKind; party?: string[]; adult: boolean; branches: Record<string, string>; strong?: Element; acts?: number; awakened: boolean; sim: SimOptions }

const runAll = (s: Setup, sim: SimOptions = s.sim) => Array.from({ length: s.n }, (_, i) => simulateRun(i, s.kind, s.party, s.adult, s.branches, s.strong, s.acts, s.awakened, { ...s.sim, ...sim }));
const pct = (x: number) => `${(x * 100).toFixed(1).padStart(5)}%`;
/** 승률과 구간: " 53.8% [49.8–57.8]" */
const rate = (k: number, n: number) => { const [lo, hi] = wilson(k, n); return `${pct(n ? k / n : 0)} [${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}]`; };
const winRate = (rs: RunSimResult[]) => rate(rs.filter((r) => r.won).length, rs.length);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);

const REWARD_LABEL: Record<string, string> = { default: "가려 받기", any: "아무거나 받기", skip: "전부 넘기기" };
const PATH_LABEL: Record<string, string> = { fight: "전투 먼저", default: "기본", avoid: "전투 피하기", elite: "정예 먼저", noelite: "정예 피하기" };

/**
 * 보상 × 길 승률 표 (P1-01 · 02 · 04). 전투 봇은 그대로 두고 판 단위 버릇만 바꿔요.
 * 의도한 플레이는 "카드를 받고 전투를 찾아가는 판"이에요. 가장 잘 이기는 버릇이 그쪽이 아니면 덱을 지을 이유가 숫자로 안 선 거예요.
 */
function policyTable(s: Setup) {
  const cells = REWARD_MODES.flatMap((reward) => PATH_MODES.map((path) => { const rs = runAll(s, { reward, path }); return { reward, path, wins: rs.filter((r) => r.won).length, fights: mean(rs.filter((r) => r.won).map((r) => r.battles)), cards: mean(rs.filter((r) => r.won).map((r) => r.taken.length)) }; }));
  console.log(`\n보상 × 길 (클리어, n=${s.n}씩 · 괄호는 이긴 판의 전투 수 / 받은 카드 수)`);
  console.log(`${"".padEnd(16)}${PATH_MODES.map((p) => PATH_LABEL[p].padEnd(34)).join("")}`);
  for (const reward of REWARD_MODES) console.log(`${REWARD_LABEL[reward].padEnd(16 - REWARD_LABEL[reward].length / 2)}${PATH_MODES.map((path) => { const c = cells.find((x) => x.reward === reward && x.path === path)!; return `${rate(c.wins, s.n)} (${c.fights.toFixed(1)} / ${c.cards.toFixed(1)})`.padEnd(34); }).join("")}`);
  const best = [...cells].sort((a, z) => z.wins - a.wins)[0], worst = [...cells].sort((a, z) => a.wins - z.wins)[0];
  const intended = cells.find((c) => c.reward === "default" && c.path === "fight")!;
  const [, intendedHi] = wilson(intended.wins, s.n), [bestLo] = wilson(best.wins, s.n);
  console.log(`버릇에 따른 폭 ${(((best.wins - worst.wins) / s.n) * 100).toFixed(1)}%p · 가장 잘 이기는 버릇: ${REWARD_LABEL[best.reward]} + ${PATH_LABEL[best.path]} · 의도한 플레이(가려 받기 + 전투 먼저)와의 차이 ${(((best.wins - intended.wins) / s.n) * 100).toFixed(1)}%p ${bestLo > intendedHi ? "✗ 구간 밖" : "✓ 구간 안"}`);
}

/**
 * 카드별 표 (P1-01 · 11).
 *   받은 판 승률: 아무거나 받는 버릇에서 이 카드를 받은 판과 안 받은 판 (끝까지 간 판이 카드를 더 많이 받아서 받은 쪽이 높게 나와요. 카드끼리 견줘 읽어요)
 *   이 카드만: 이 카드가 나오면 받고 나머지는 넘긴 판. 전부 넘기기와 견줘요. 구간 밖으로 낮으면 ▼, 높으면 ▲
 */
function cardTable(s: Setup) {
  const any = runAll(s, { reward: "any" });
  const skip = runAll(s, { reward: "skip" });
  const [skipLo, skipHi] = wilson(skip.filter((r) => r.won).length, s.n);
  const ids = [...new Set(any.flatMap((r) => r.offered))];
  const rows = ids.map((id) => {
    const withIt = any.filter((r) => r.taken.includes(id)), without = any.filter((r) => !r.taken.includes(id));
    const solo = runAll(s, { reward: `only:${id}` });
    const k = solo.filter((r) => r.won).length, [lo, hi] = wilson(k, s.n);
    return { id, shown: any.reduce((a, r) => a + r.offered.filter((x) => x === id).length, 0), withIt, without, k, mark: lo > skipHi ? "▲" : hi < skipLo ? "▼" : " " };
  }).sort((a, z) => z.k - a.k);
  console.log(`\n카드별 (n=${s.n}씩) · 전부 넘기기 ${winRate(skip)} · 아무거나 받기 ${winRate(any)}`);
  console.log(`${"카드".padEnd(22)}${"희귀도".padEnd(10)}${"나온 수".padEnd(8)}${"받은 판 승률".padEnd(22)}${"안 받은 판".padEnd(10)}이 카드만`);
  for (const r of rows) console.log(`${r.id.padEnd(24)}${cardDef(r.id).rarity.padEnd(13)}${String(r.shown).padEnd(11)}${`${winRate(r.withIt)} n=${r.withIt.length}`.padEnd(28)}${pct(r.without.filter((x) => x.won).length / Math.max(1, r.without.length)).padEnd(15)}${rate(r.k, s.n)} ${r.mark}`);
  console.log(`넘기기보다 구간 밖으로 높은 카드 ${rows.filter((r) => r.mark === "▲").length}장 · 낮은 카드 ${rows.filter((r) => r.mark === "▼").length}장 (전체 ${rows.length}장)`);
}

/** 끝난 층 표 (P1-04): 진 판이 막 · 층마다 얼마나 되는지. 보스는 8층이에요 */
function floorTable(s: Setup) {
  const rs = runAll(s);
  console.log(`\n끝난 곳 (n=${s.n}, 클리어 ${winRate(rs)})`);
  for (let act = 1; act <= Math.max(...rs.map((r) => r.act)); act++) {
    const lost = rs.filter((r) => !r.won && r.act === act);
    const by = new Map<number, number>();
    for (const r of lost) by.set(r.floor, (by.get(r.floor) ?? 0) + 1);
    console.log(`  ${act}막 ${pct(lost.length / s.n)}  ${[...by].sort((a, z) => a[0] - z[0]).map(([f, k]) => `${f}층 ${((k / s.n) * 100).toFixed(1)}%`).join(" · ")}`);
  }
}

/** 정예의 값 (P1-10): 정예를 찾아간 판과 피한 판. 정예 한 번이 승률을 얼마나 바꾸는지 봐요 */
function eliteTable(s: Setup) {
  console.log(`\n정예 (n=${s.n}씩)`);
  for (const path of ["elite", "default", "noelite"] as PathMode[]) {
    const rs = runAll(s, { path });
    console.log(`  ${PATH_LABEL[path].padEnd(10)} 클리어 ${winRate(rs)}  판마다 정예 ${mean(rs.map((r) => r.nodes.elite ?? 0)).toFixed(1)}번 · 정예에서 끝남 ${pct(rs.filter((r) => !r.won && r.endedType === "elite").length / s.n)}`);
  }
}

/**
 * 판 안 성장 표 (0157): 막 보스를 만났을 때의 레벨과 단계, 키운 때. 기준은 1 · 2막 유체, 3 · 4막 성체, 5막 각성체(0085)예요.
 * 문턱(growth.json levels)을 고칠 때 이 표로 봐요.
 */
function growthTable(s: Setup) {
  const rs = runAll(s);
  console.log(`\n판 안 성장 (n=${s.n}, 클리어 ${winRate(rs)})`);
  for (let act = 1; act <= (s.acts ?? 1); act++) {
    const met = rs.flatMap((r) => r.atBoss.filter((x) => x.act === act));
    if (!met.length) continue;
    const share = (stage: Stage) => pct(mean(met.map((x) => x.stages.filter((y) => y === stage).length / x.stages.length)));
    const levels = new Map<number, number>();
    for (const x of met) levels.set(x.level, (levels.get(x.level) ?? 0) + 1);
    const exps = met.map((x) => x.exp).sort((a, z) => a - z);
    const q = (p: number) => exps[Math.min(exps.length - 1, Math.floor(p * exps.length))];
    console.log(`  ${act}막 보스 (${met.length}판)  경험 ${q(0.1)} · ${q(0.5)} · ${q(0.9)} (10 · 50 · 90%)  레벨 ${[...levels].sort((a, z) => a[0] - z[0]).map(([lv, k]) => `Lv${lv} ${((k / met.length) * 100).toFixed(0)}%`).join(" · ")}  유체 ${share("baby")} · 성체 ${share("adult")} · 각성체 ${share("awakened")}`);
  }
  for (const to of ["adult", "awakened"] as Stage[]) {
    const all = rs.flatMap((r) => r.grew.filter((x) => x.to === to));
    const by = new Map<string, number>();
    for (const x of all) by.set(`${x.act}막 ${x.floor}층`, (by.get(`${x.act}막 ${x.floor}층`) ?? 0) + 1);
    console.log(`  ${to === "adult" ? "성체" : "각성체"}로 키운 때 (정령 ${all.length})  ${[...by].sort().map(([k, v]) => `${k} ${((v / Math.max(1, all.length)) * 100).toFixed(0)}%`).join(" · ")}`);
  }
}

function report(label: string, s: Setup) {
  const { n, kind, acts } = s;
  const rs = runAll(s);
  const boss = rs.filter((r) => r.bossDeck !== undefined);
  const wins = rs.filter((r) => r.won);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
  const deaths = new Map<string, number>();
  for (const r of rs) if (!r.won) deaths.set(r.endedAt, (deaths.get(r.endedAt) ?? 0) + 1);
  const top = [...deaths].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${((v / n) * 100).toFixed(0)}%`).join(" · ");
  const [lo, hi] = wilson(wins.length, n);
  const perAct = (acts ?? 1) > 1 ? Array.from({ length: acts! }, (_, i) => {
    const met = rs.flatMap((r) => r.bosses.filter((x) => x.act === i + 1));
    return `  ${i + 1}막 통과 ${pct(rs.filter((r) => r.actsCleared > i).length / n)} (보스 도착 HP ${pct(avg(met.map((x) => x.hpPct)))} · ${avg(met.map((x) => x.turns)).toFixed(1)}턴)`;
  }).join("") : "";
  const picks = rs.flatMap((r) => r.picks);
  const takeRate = (xs: typeof picks) => (xs.length ? `${((xs.filter((x) => x.took).length / xs.length) * 100).toFixed(0)}%` : "-");
  const byAct = Array.from({ length: acts ?? 1 }, (_, i) => takeRate(picks.filter((x) => x.act === i + 1))).join(" · ");
  console.log(
    `${label.padEnd(30)} ${kind.padEnd(6)} n=${String(n).padEnd(5)} 클리어 ${pct(wins.length / n)} [${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}]  보스 도달 ${pct(boss.length / n)}  ` +
    `보스 때 덱 ${avg(boss.map((r) => r.bossDeck!)).toFixed(1).padStart(4)}장 · HP ${pct(avg(boss.map((r) => r.bossHpPct!)))} · ${avg(boss.map((r) => r.bossTurns!)).toFixed(1)}턴  잡몹 ${avg(rs.flatMap((r) => r.mobTurns)).toFixed(1)}턴 · 정예 ${avg(rs.flatMap((r) => r.eliteTurns)).toFixed(1)}턴  받기 ${takeRate(picks)} (막별 ${byAct})  끝난 곳: ${top}${perAct}`,
  );
}

function parseWhatIf(arg: string): WhatIf {
  const out: WhatIf = {};
  for (const part of arg.split(",").filter(Boolean)) {
    const [k, v] = part.split(":");
    if (k === "nojoin" || k === "swap" || k === "noskipgold" || k === "earlyfights" || k === "upgraded") out[k] = true;
    else if (k === "offer" || k === "start" || k === "winheal" || k === "join" || k === "mate" || k === "cards" || k === "foe") out[k] = Number(v);
    else throw new Error(`모르는 whatif: ${part}`);
  }
  return out;
}

if (process.argv[1]?.endsWith("runsim.ts")) {
  const args = process.argv.slice(2);
  const botAt = args.indexOf("--bot");
  const botArg = botAt >= 0 ? args.splice(botAt, 2)[1] : "smart";
  const branchAt = args.indexOf("--branch");
  const branches = Object.fromEntries((branchAt >= 0 ? args.splice(branchAt, 2)[1] : "").split(",").filter(Boolean).map((x) => x.split(":")));
  const strongAt = args.indexOf("--strong");
  const strong = strongAt >= 0 ? (args.splice(strongAt, 2)[1] as Element) : undefined;
  const actsAt = args.indexOf("--acts");
  const acts = actsAt >= 0 ? Number(args.splice(actsAt, 2)[1]) : undefined;
  const opt = (name: string) => { const at = args.indexOf(name); return at >= 0 ? args.splice(at, 2)[1] : undefined; };
  const sim: SimOptions = { reward: opt("--reward") as RewardMode | undefined, path: opt("--path") as PathMode | undefined, whatif: parseWhatIf(opt("--whatif") ?? "") };
  const simLabel = [sim.reward && `보상 ${sim.reward}`, sim.path && `길 ${sim.path}`, Object.keys(sim.whatif!).length && `whatif ${Object.entries(sim.whatif!).map(([k, v]) => (v === true ? k : `${k}:${v}`)).join(",")}`].filter(Boolean).join(" · ");
  if (simLabel) console.log(`[${simLabel}]`);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const rest = args.filter((a) => !a.startsWith("--"));
  const n = Number(rest[0] ?? 2000);
  const adult = flags.has("--adult");
  const awakened = flags.has("--awakened");
  const kinds = botArg === "ladder" ? BOT_KINDS : [botArg as BotKind];
  if (!kinds.every((k) => BOT_KINDS.includes(k))) throw new Error(`모르는 봇: ${botArg}`);
  // 탐색 봇은 한 판에 1초쯤 걸려서 판 수를 줄여요
  const runs = (k: BotKind) => (k === "search" ? Math.min(n, 300) : n);
  if (flags.has("--all")) {
    const { SPIRITS } = await import("../src/core/data");
    for (const s of SPIRITS) for (const k of kinds) report(`혼자 ${s.id}${adult ? " (성체)" : ""}`, { n: runs(k), kind: k, party: [s.id], adult, branches, strong, acts, awakened, sim });
  } else {
    const party = rest[1]?.split(",");
    for (const k of kinds) {
      const setup: Setup = { n: runs(k), kind: k, party, adult, branches, strong, acts, awakened, sim };
      report(`${party?.join(",") ?? "기본 파티"}${strong ? ` · ${strong}` : ""}${awakened ? " (각성체)" : adult ? " (성체)" : ""}`, setup);
      if (flags.has("--policies")) policyTable(setup);
      if (flags.has("--cards")) cardTable(setup);
      if (flags.has("--floors")) floorTable(setup);
      if (flags.has("--elites")) eliteTable(setup);
      if (flags.has("--growth")) growthTable(setup);
    }
  }
}
