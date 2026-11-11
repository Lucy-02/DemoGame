// 정원: 판 밖에 남는 정령 상태와 그 규칙 (결정 0021). 순수 함수만 있고, 상태는 바꾸지 않고 새로 만들어 돌려줘요.
// 화면·저장·전투 결과 받기는 session 층이 이 함수들을 불러서 해요.
import { C, CARDS, GROWTH, PERSONALITIES, SPIRITS } from "./data";
import { Rng } from "./rng";
import { isGrown, stageRank } from "./stats";
import type { CardDef, DeedDef, EpisodeDef, EvolutionDef, RunSpirit, Stage } from "./types";

export const GARDEN_VERSION = 1;

export type BattleTier = "normal" | "elite" | "boss";

/** 정령 한 마리가 판 밖에 남기는 것 */
export interface GardenSpirit {
  id: string;
  exp: number;
  stage: Stage;
  /** 성체에서 고른 갈래 (0027). 고르면 못 바꿔요 (0052) */
  branch?: string;
  /** 열린 갈래. 한 번 열리면 판을 넘어 남아요 (0047 Lucy 2026-11-10) */
  openBranches?: string[];
  /** 부화 때 한 번 정하고 유지해요. 유체부터 보여요 (0033) */
  personality: string;
  /** 다음 진화의 자람 조건 누적값. 진화하면 0으로 */
  deed: number;
  affinity: number;
  /** 본 유대 에피소드 수 */
  episodes: number;
  /** 플레이어가 이미 본 해금 키 (할 일 배지를 지우는 데 써요) */
  seen: string[];
  /** 남긴 장비 (0048 · 0056). 길이 ≤ equipSlots(stage), 공명 ≤ resonanceCap(stage) */
  equipment?: GardenEquip[];
  /** 분해로 얻은 그 정령의 공명 권 (이름 TODO_NAME) */
  resonanceTokens?: number;
}

export interface GardenEquip {
  id: string;
  resonance: number;
}

export interface Garden {
  version: number;
  spirits: GardenSpirit[];
  /** 정원 재료 (이름 TODO_NAME) */
  material: number;
  act1Boss: boolean;
  /** 깃들기 후보를 뽑는 씨앗 (0053). 같은 정원이면 다시 켜도 같은 후보예요 */
  seed?: number;
  /** 끝낸 판 수 (져도 세요) */
  runs?: number;
  /** 아직 고르지 않은 깃들기 수 (0053) */
  joins?: number;
}

// ───────────────────────── 만들기 · 찾기 ─────────────────────────

/** 정령을 골라 만드는 정원(시험 · 자동 플레이). 정령마다 성격을 한 번 뽑아요. 같은 시드면 같은 정원이에요. 기본은 constants.default_party 셋이에요 */
export function newGarden(seed: number, ids: readonly string[] = C.default_party as string[]): Garden {
  const rng = new Rng(seed);
  return {
    version: GARDEN_VERSION,
    material: 0,
    act1Boss: false,
    seed, runs: 0, joins: 0,
    spirits: ids.map((id) => ({
      id, exp: 0, stage: "baby", personality: rng.pick(PERSONALITIES).id, deed: 0, affinity: 0, episodes: 0, seen: [],
    })),
  };
}

/** 새로 하기의 정원 (0053): 시작 풀에서 무작위 하나로 시작해요 */
export function startGarden(seed: number): Garden {
  return newGarden(seed, [new Rng(seed ^ START_SALT).pick(C.start_pool as string[])]);
}

const START_SALT = 0x51ed;

/** 지금 깃들 수 있는 후보: 시작 풀에서 아직 없는 정령 가운데 둘 (0053). 고를 것이 없으면 빈 목록 */
export function joinOffer(g: Garden): string[] {
  if (!g.joins) return [];
  const left = (C.start_pool as string[]).filter((id) => !g.spirits.some((s) => s.id === id));
  return new Rng((g.seed ?? 0) + g.spirits.length * 7919).shuffle(left).slice(0, 2);
}

/** 후보 가운데 하나가 깃들어요 */
export function join(g: Garden, id: string): Garden {
  if (!joinOffer(g).includes(id)) return g;
  const personality = new Rng((g.seed ?? 0) + g.spirits.length * 104729).pick(PERSONALITIES).id;
  return {
    ...g, joins: (g.joins ?? 0) - 1,
    spirits: [...g.spirits, { id, exp: 0, stage: "baby", personality, deed: 0, affinity: 0, episodes: 0, seen: [] }],
  };
}

/** 시작 풀에 아직 없는 정령이 남았을 때만 깃들기를 하나 더해요 */
const grantJoin = (g: Garden): Garden =>
  (C.start_pool as string[]).filter((id) => !g.spirits.some((s) => s.id === id)).length > (g.joins ?? 0) ? { ...g, joins: (g.joins ?? 0) + 1 } : g;

/** 판이 끝났어요(져도). 첫 판을 끝내면 둘째 정령이 깃들어요 (0053) */
export function endRun(g: Garden): Garden {
  const runs = (g.runs ?? 0) + 1;
  return runs === 1 ? grantJoin({ ...g, runs }) : { ...g, runs };
}

export function gardenSpirit(g: Garden, id: string): GardenSpirit {
  const s = g.spirits.find((x) => x.id === id);
  if (!s) throw new Error(`정원에 없는 정령: ${id}`);
  return s;
}

const withSpirit = (g: Garden, id: string, f: (s: GardenSpirit) => GardenSpirit): Garden => ({
  ...g, spirits: g.spirits.map((s) => (s.id === id ? f(s) : s)),
});

// ───────────────────────── 레벨 ─────────────────────────

export function levelOf(exp: number): number {
  let lv = 1;
  GROWTH.levels.forEach((need, i) => {
    if (exp >= need) lv = i + 1;
  });
  return lv;
}

/** 지금 레벨 안에서의 진척. 최대 레벨이면 next가 없어요. */
export function levelProgress(exp: number): { level: number; from: number; next?: number } {
  const level = levelOf(exp);
  return { level, from: GROWTH.levels[level - 1], next: GROWTH.levels[level] };
}

// ───────────────────────── 진화 ─────────────────────────

/** 이 정령이 지금 단계에서 갈 수 있는 진화들. 둘 이상이면 분기예요. */
export function evolutionsFrom(s: Pick<GardenSpirit, "id" | "stage">): EvolutionDef[] {
  return GROWTH.evolutions.filter((e) => e.spirit === s.id && e.from === s.stage);
}

export interface EvolveCheck {
  evo: EvolutionDef;
  /** 레벨이 됐나 */
  level: boolean;
  /** 자람 조건이 됐나 (조건 없으면 true) */
  deed: boolean;
  /** 갈래가 열렸나 (갈래가 아니거나 조건이 없으면 true) */
  open: boolean;
  ok: boolean;
}

const isOpen = (s: GardenSpirit, evo: EvolutionDef) =>
  !evo.branch || !evo.opens || (s.openBranches ?? []).includes(evo.branch);

function check(s: GardenSpirit, evo: EvolutionDef): EvolveCheck {
  const level = levelOf(s.exp) >= evo.level;
  const deed = !evo.deed || s.deed >= evo.deed.n;
  const open = isOpen(s, evo);
  return { evo, level, deed, open, ok: level && deed && open };
}

/** 지금 단계에서 갈 수 있는 갈래마다의 검사. 갈래 고르기 창이 이것만 읽어요. 분기가 아니면 한 줄이에요. */
export function evolveChoices(s: GardenSpirit): EvolveCheck[] {
  return evolutionsFrom(s).map((e) => check(s, e));
}

/** 배지·링·버튼이 모두 이 결과만 읽어요. 규칙과 표시가 어긋나지 않게요.
 *  갈래를 안 주면 갈 수 있는 갈래가 하나라도 있는지 봐요(없으면 첫 줄). */
export function canEvolve(s: GardenSpirit, to?: Stage, branch?: string): EvolveCheck | null {
  const all = evolveChoices(s).filter((c) => (!to || c.evo.to === to) && (!branch || c.evo.branch === branch));
  return all.find((c) => c.ok) ?? all[0] ?? null;
}

/** 이 진화가 갈래 고르기인가 (같은 전 단계 줄이 둘 이상) */
export const isBranching = (s: Pick<GardenSpirit, "id" | "stage">) => evolutionsFrom(s).length > 1;

/** 키우기. 조건이 안 되면 그대로 돌려줘요. 갈래 고르기면 branch가 있어야 해요.
 *  적용 시점(전투 중이면 다음 턴부터)은 부르는 쪽이 정해요. */
export function evolve(g: Garden, id: string, to?: Stage, branch?: string): Garden {
  const s = gardenSpirit(g, id);
  if (isBranching(s) && !branch) return g;
  const c = canEvolve(s, to, branch);
  if (!c?.ok) return g;
  return withSpirit(g, id, (x) => ({ ...x, stage: c.evo.to, deed: 0, ...(c.evo.branch ? { branch: c.evo.branch } : {}) }));
}

/** 이번 탐험에서 받은 카드로 갈래를 열어요 (0027). received = 정령 id → 받은 카드 id들. 열린 갈래는 남아요. */
export function openBranches(g: Garden, received: Readonly<Record<string, readonly string[]>>): Garden {
  return {
    ...g,
    spirits: g.spirits.map((s) => {
      const got = received[s.id] ?? [];
      const opened = new Set(s.openBranches ?? []);
      for (const evo of GROWTH.evolutions) {
        if (evo.spirit !== s.id || !evo.branch || !evo.opens || opened.has(evo.branch)) continue;
        const n = got.filter((id) => CARDS.find((c) => c.id === id)?.branch === evo.branch).length;
        if (n >= evo.opens.cards) opened.add(evo.branch);
      }
      return opened.size === (s.openBranches ?? []).length ? s : { ...s, openBranches: [...opened] };
    }),
  };
}

/** 갈래 조건 진척: 이번 탐험에서 받은 그 갈래 카드 수 (잠긴 갈래 판의 막대) */
export function branchProgress(evo: EvolutionDef, received: readonly string[]): { have: number; need: number } | null {
  if (!evo.branch || !evo.opens) return null;
  const have = received.filter((id) => CARDS.find((c) => c.id === id)?.branch === evo.branch).length;
  return { have, need: evo.opens.cards };
}

export const isFinalStage = (s: Pick<GardenSpirit, "id" | "stage">) => evolutionsFrom(s).length === 0;

/** 다음 진화의 자람 조건 (없으면 undefined) */
export const nextDeed = (s: GardenSpirit): DeedDef | undefined => evolutionsFrom(s)[0]?.deed;

// ───────────────────────── 판에서 받는 것 ─────────────────────────

/** 이긴 전투 하나: 출전한 정령이 똑같이 경험을 받고(쓰러져도), 재료가 쌓여요. 판이 실패해도 이긴 만큼은 남아요.
 *  출전하지 않은 정령은 받지 않아요. 첫 보스를 가라앉히면 정령이 하나 더 깃들어요 (0053). */
export function grantBattle(g: Garden, party: readonly string[], tier: BattleTier): Garden {
  const exp = GROWTH.exp[tier];
  if (tier === "boss" && !g.act1Boss) g = grantJoin(g);
  return {
    ...g,
    material: g.material + GROWTH.material[tier],
    act1Boss: g.act1Boss || tier === "boss",
    spirits: g.spirits.map((s) => (party.includes(s.id) ? { ...s, exp: s.exp + exp } : s)),
  };
}

/** 전투 이벤트에서 센 자람 조건을 더해요. 지금 진화 조건과 종류가 같을 때만 쌓여요. */
export function addDeed(g: Garden, id: string, kind: DeedDef["kind"], n: number): Garden {
  const deed = nextDeed(gardenSpirit(g, id));
  if (!deed || deed.kind !== kind) return g;
  return withSpirit(g, id, (s) => ({ ...s, deed: s.deed + n }));
}

// ───────────────────────── 해금 ─────────────────────────

/** 정원 상태로 열린 해금 키 (카드 데이터의 unlock 값) */
export function unlockKeys(g: Garden): Set<string> {
  const keys = new Set<string>(["start"]);
  for (const s of g.spirits) for (const k of spiritUnlocks(s)) keys.add(k);
  if (g.spirits.some((s) => levelOf(s.exp) >= 3)) keys.add("any_lv3");
  if (g.spirits.some((s) => isGrown(s))) keys.add("any_adult");
  if (g.act1Boss) keys.add("act1_boss");
  return keys;
}

/** 이 정령의 전용 해금 키 중 열린 것 */
export function spiritUnlocks(s: GardenSpirit): string[] {
  const lv = levelOf(s.exp);
  return [
    ...(lv >= 2 ? [`${s.id}_lv2`] : []),
    ...(lv >= 3 ? [`${s.id}_lv3`] : []),
    ...(isGrown(s) ? [`${s.id}_adult`] : []),
  ];
}

/** 이 정령의 전용 해금 키 전체 (열린 순서대로) */
export const SPIRIT_UNLOCK_STEPS = ["lv2", "lv3", "adult"] as const;

const hasCard = (key: string) => CARDS.some((c) => c.unlock === key);

/** 해금됐나. 갈래 카드의 성체 해금은 고른 갈래의 카드만 열려요 (0027 갈래 고유 카드) */
export function isCardUnlocked(g: Garden, card: CardDef): boolean {
  if (!unlockKeys(g).has(card.unlock)) return false;
  return !isBranchAdultCard(card) || g.spirits.find((s) => s.id === card.spirit)?.branch === card.branch;
}

/** 갈래 표시가 있는 성체 해금 카드 (갈래마다 하나) */
export const isBranchAdultCard = (card: CardDef) => !!card.branch && !!card.spirit && card.unlock === `${card.spirit}_adult`;

/** 해금을 봤다고 표시해요 (보면 배지가 사라져요, "받기" 버튼 없음) */
export function markSeen(g: Garden, id: string, keys: readonly string[]): Garden {
  return withSpirit(g, id, (s) => ({ ...s, seen: [...new Set([...s.seen, ...keys])] }));
}

// ───────────────────────── 유대 · 먹이기 · 성격 ─────────────────────────

const meetsStage = (s: GardenSpirit, need?: Stage) => !need || stageRank(s.stage) >= stageRank(need);

/** 이 정령이 지금 볼 수 있는 에피소드 수 (본 것 포함) */
export function episodesOpen(s: GardenSpirit): number {
  let n = 0;
  for (const ep of GROWTH.episodes) {
    if (s.affinity < ep.affinity || !meetsStage(s, ep.stage)) break;
    n++;
  }
  return n;
}

export function seeEpisode(g: Garden, id: string): Garden {
  const s = gardenSpirit(g, id);
  if (s.episodes >= episodesOpen(s)) return g;
  return withSpirit(g, id, (x) => ({ ...x, episodes: x.episodes + 1 }));
}

/** 먹이기 한 번에 오르는 호감도 */
export const feedGain = (_s: GardenSpirit) => GROWTH.feed.affinity;

export const canFeed = (g: Garden) => g.material >= GROWTH.feed.cost;

export function feed(g: Garden, id: string): Garden {
  if (!canFeed(g)) return g;
  const gain = feedGain(gardenSpirit(g, id));
  return withSpirit({ ...g, material: g.material - GROWTH.feed.cost }, id, (s) => ({ ...s, affinity: s.affinity + gain }));
}

// ───────────────────────── 판으로 ─────────────────────────

/** 정원의 정령을 판의 정령으로. HP는 최대 HP로 채워요 (부르는 쪽에서 maxHpOf로) */
export function toRunSpirit(s: GardenSpirit): RunSpirit {
  return {
    id: s.id, hp: 0, maxHpBonus: 0, stage: s.stage, level: levelOf(s.exp), personality: s.personality, branch: s.branch,
    equipment: (s.equipment ?? []).map((e) => ({ ...e, from: "kept" })),
  };
}

// ───────────────────────── 할 일 ─────────────────────────

export type Todo =
  | { kind: "evolve"; to: Stage }
  | { kind: "unlock"; key: string }
  | { kind: "episode" };

/** 행동이 남은 것만 (0021 5절). 먹이기는 늘 할 수 있어서 넣지 않아요. */
export function todos(s: GardenSpirit): Todo[] {
  const out: Todo[] = [];
  const evo = canEvolve(s);
  if (evo?.ok) out.push({ kind: "evolve", to: evo.evo.to });
  // 카드가 아직 없는 해금 키(예: 유리 도롱뇽 성체 카드 빈칸, 0020)는 볼 것이 없으니 할 일이 아니에요
  for (const key of spiritUnlocks(s)) if (!s.seen.includes(key) && hasCard(key)) out.push({ kind: "unlock", key });
  if (episodesOpen(s) > s.episodes) out.push({ kind: "episode" });
  return out;
}
