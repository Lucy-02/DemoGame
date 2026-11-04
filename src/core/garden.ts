// 정원: 판 밖에 남는 정령 상태와 그 규칙 (결정 0021). 순수 함수만 있고, 상태는 바꾸지 않고 새로 만들어 돌려줘요.
// 화면·저장·전투 결과 받기는 session 층이 이 함수들을 불러서 해요.
import { CARDS, GROWTH, PERSONALITIES, SPIRITS } from "./data";
import { Rng } from "./rng";
import { baseStat, isGrown, round, stageRank } from "./stats";
import type { CardDef, DeedDef, EpisodeDef, EvolutionDef, RunSpirit, Stage } from "./types";

export const GARDEN_VERSION = 1;

export type BattleTier = "normal" | "elite" | "boss";

/** 정령 한 마리가 판 밖에 남기는 것 */
export interface GardenSpirit {
  id: string;
  exp: number;
  stage: Stage;
  /** 분기 진화로 고른 갈래. MVP는 비어 있어요 (0015) */
  branch?: string;
  /** 부화 때 한 번 정하고 유지해요. 유체 동안은 숨겨져 있어요 */
  personality: string;
  /** 다음 진화의 자람 조건 누적값. 진화하면 0으로 */
  deed: number;
  affinity: number;
  /** 본 유대 에피소드 수 */
  episodes: number;
  /** 플레이어가 이미 본 해금 키 (할 일 배지를 지우는 데 써요) */
  seen: string[];
}

export interface Garden {
  version: number;
  spirits: GardenSpirit[];
  /** 정원 재료 (이름 TODO_NAME) */
  material: number;
  act1Boss: boolean;
}

// ───────────────────────── 만들기 · 찾기 ─────────────────────────

/** 새 정원: 정령마다 성격을 한 번 뽑아요. 같은 시드면 같은 정원이에요. */
export function newGarden(seed: number, ids: readonly string[] = SPIRITS.map((s) => s.id)): Garden {
  const rng = new Rng(seed);
  return {
    version: GARDEN_VERSION,
    material: 0,
    act1Boss: false,
    spirits: ids.map((id) => ({
      id, exp: 0, stage: "baby", personality: rng.pick(PERSONALITIES).id, deed: 0, affinity: 0, episodes: 0, seen: [],
    })),
  };
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

export const MAX_LEVEL = GROWTH.levels.length;

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
  ok: boolean;
}

/** 배지·링·버튼이 모두 이 결과만 읽어요. 규칙과 표시가 어긋나지 않게요. */
export function canEvolve(s: GardenSpirit, to?: Stage): EvolveCheck | null {
  const evo = evolutionsFrom(s).find((e) => !to || e.to === to);
  if (!evo) return null;
  const level = levelOf(s.exp) >= evo.level;
  const deed = !evo.deed || s.deed >= evo.deed.n;
  return { evo, level, deed, ok: level && deed };
}

/** 키우기. 조건이 안 되면 그대로 돌려줘요. 적용 시점(전투 중이면 다음 턴부터)은 부르는 쪽이 정해요. */
export function evolve(g: Garden, id: string, to?: Stage): Garden {
  const check = canEvolve(gardenSpirit(g, id), to);
  if (!check?.ok) return g;
  return withSpirit(g, id, (s) => ({ ...s, stage: check.evo.to, deed: 0 }));
}

export const isFinalStage = (s: Pick<GardenSpirit, "id" | "stage">) => evolutionsFrom(s).length === 0;

/** 다음 진화의 자람 조건 (없으면 undefined) */
export const nextDeed = (s: GardenSpirit): DeedDef | undefined => evolutionsFrom(s)[0]?.deed;

// ───────────────────────── 판에서 받는 것 ─────────────────────────

/** 이긴 전투 하나: 출전한 셋이 똑같이 경험을 받고(쓰러져도), 재료가 쌓여요. 판이 실패해도 이긴 만큼은 남아요. */
export function grantBattle(g: Garden, party: readonly string[], tier: BattleTier): Garden {
  const exp = GROWTH.exp[tier];
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

/** 정원 상태로 열린 해금 키 (cards.json의 unlock 값) */
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
export const spiritUnlockKey = (id: string, step: (typeof SPIRIT_UNLOCK_STEPS)[number]) => `${id}_${step}`;

const hasCard = (key: string) => CARDS.some((c) => c.unlock === key);

export const isCardUnlocked = (g: Garden, card: CardDef) => unlockKeys(g).has(card.unlock);

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

export const nextEpisode = (s: GardenSpirit): EpisodeDef | undefined => GROWTH.episodes[s.episodes];

export function seeEpisode(g: Garden, id: string): Garden {
  const s = gardenSpirit(g, id);
  if (s.episodes >= episodesOpen(s)) return g;
  return withSpirit(g, id, (x) => ({ ...x, episodes: x.episodes + 1 }));
}

/** 먹이기 한 번에 오르는 호감도: 기본 × 싱크/10 (기획서 v0.2 "싱크 = 호감도 상승량") */
export const feedGain = (s: GardenSpirit) => round((GROWTH.feed.affinity * baseStat(toRunSpirit(s), "sync")) / 10);

export const canFeed = (g: Garden) => g.material >= GROWTH.feed.cost;

export function feed(g: Garden, id: string): Garden {
  if (!canFeed(g)) return g;
  const gain = feedGain(gardenSpirit(g, id));
  return withSpirit({ ...g, material: g.material - GROWTH.feed.cost }, id, (s) => ({ ...s, affinity: s.affinity + gain }));
}

export const canReroll = (g: Garden, s: GardenSpirit) =>
  meetsStage(s, GROWTH.reroll.from) && g.material >= GROWTH.reroll.cost;

/** 다시 뽑을 때 고를 수 있는 성격 (지금 성격 제외). 3화를 봤으면 둘, 아니면 하나 */
export function rerollChoices(s: GardenSpirit, rng: Rng): string[] {
  const n = GROWTH.episodes.slice(0, s.episodes).reduce((a, ep) => Math.max(a, ep.reroll_choices ?? 1), 1);
  const pool = PERSONALITIES.map((p) => p.id).filter((p) => p !== s.personality);
  return rng.shuffle(pool).slice(0, n);
}

/** 고른 성격으로 바꾸고 재료를 써요 */
export function reroll(g: Garden, id: string, personality: string): Garden {
  const s = gardenSpirit(g, id);
  if (!canReroll(g, s) || personality === s.personality) return g;
  return withSpirit({ ...g, material: g.material - GROWTH.reroll.cost }, id, (x) => ({ ...x, personality }));
}

// ───────────────────────── 판으로 ─────────────────────────

/** 전투를 시작할 때 차 있는 싱크: 단계 + 본 에피소드. 모두 합쳐 상한까지 */
export function startSync(s: GardenSpirit): number {
  const fromStage = GROWTH.stage_start_sync[s.stage] ?? 0;
  const fromBond = GROWTH.episodes.slice(0, s.episodes).reduce((a, ep) => a + (ep.start_sync ?? 0), 0);
  return Math.min(GROWTH.start_sync_cap, fromStage + fromBond);
}

/** 정원의 정령을 판의 정령으로. HP는 최대 HP로 채워요 (부르는 쪽에서 maxHpOf로) */
export function toRunSpirit(s: GardenSpirit): RunSpirit {
  return {
    id: s.id, hp: 0, maxHpBonus: 0, stage: s.stage, level: levelOf(s.exp), personality: s.personality, startSync: startSync(s),
  };
}

// ───────────────────────── 할 일 ─────────────────────────

export type Todo =
  | { kind: "evolve"; to: Stage }
  | { kind: "unlock"; key: string }
  | { kind: "episode" };

/** 행동이 남은 것만 (0021 5절). 먹이기·다시 뽑기는 늘 할 수 있어서 넣지 않아요. */
export function todos(s: GardenSpirit): Todo[] {
  const out: Todo[] = [];
  const evo = canEvolve(s);
  if (evo?.ok) out.push({ kind: "evolve", to: evo.evo.to });
  // 카드가 아직 없는 해금 키(예: 유리 도롱뇽 성체 카드 빈칸, 0020)는 볼 것이 없으니 할 일이 아니에요
  for (const key of spiritUnlocks(s)) if (!s.seen.includes(key) && hasCard(key)) out.push({ kind: "unlock", key });
  if (episodesOpen(s) > s.episodes) out.push({ kind: "episode" });
  return out;
}
