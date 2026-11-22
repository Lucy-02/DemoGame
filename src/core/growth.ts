// 판 안 성장 (0157): 경험 · 레벨 · 진화 · 갈래 · 자람 조건 · 카드 해금. 매 판 유체 Lv1로 떠나 그 판 안에서 자라요.
// 순수 함수만 있고, 정령은 바꾸지 않고 새로 만들어 돌려줘요. 판(Run)이 이 함수들을 불러 정령을 갈아 끼워요.
import { CARDS, GROWTH } from "./data";
import { isGrown, maxHpOf } from "./stats";
import type { CardDef, DeedDef, EvolutionDef, RunSpirit, Stage } from "./types";

export type BattleTier = "normal" | "elite" | "boss";

/** 성장에서 읽는 정령의 몫 */
type Growing = Pick<RunSpirit, "id" | "stage" | "exp" | "deed">;

// ───────────────────────── 만들기 ─────────────────────────

/** 판을 떠나는 정령: 유체 Lv1, 꽉 찬 HP */
export function freshSpirit(id: string, personality: string): RunSpirit {
  const rs: RunSpirit = { id, hp: 0, maxHpBonus: 0, stage: "baby", exp: 0, level: 1, deed: 0, personality, equipment: [] };
  return { ...rs, hp: maxHpOf(rs) };
}

/** 그 단계의 문 레벨에 막 닿은 정령 (시험 · 자동 플레이 · 고정 화면). 갈래는 부르는 쪽이 정해요 */
export function spiritAt(id: string, personality: string, stage: Stage, branch?: string): RunSpirit {
  const gate = GROWTH.evolutions.find((e) => e.spirit === id && e.to === stage)?.level ?? 1;
  const rs: RunSpirit = { ...freshSpirit(id, personality), stage, exp: GROWTH.levels[gate - 1], level: gate, ...(branch ? { branch } : {}) };
  return { ...rs, hp: maxHpOf(rs) };
}

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

/** 최대 HP가 오른 만큼 지금 HP도 올라요 (레벨 · 진화) */
const withHpGain = (before: RunSpirit, after: RunSpirit): RunSpirit => {
  const max = maxHpOf(after);
  return { ...after, hp: Math.min(max, before.hp + Math.max(0, max - maxHpOf(before))) };
};

/** 경험을 받아요. 레벨이 오르면 최대 HP가 오른 만큼 지금 HP도 올라요 */
export function gainExp(s: RunSpirit, n: number): RunSpirit {
  const exp = s.exp + n;
  return withHpGain(s, { ...s, exp, level: levelOf(exp) });
}

// ───────────────────────── 진화 ─────────────────────────

/** 이 정령이 지금 단계에서 갈 수 있는 진화들. 둘 이상이면 분기예요. */
export function evolutionsFrom(s: Pick<RunSpirit, "id" | "stage">): EvolutionDef[] {
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

const branchCount = (branch: string, ids: readonly string[]) =>
  ids.filter((id) => CARDS.find((c) => c.id === id)?.branch === branch).length;

/** 갈래 조건 진척: 이 판에서 받은 그 갈래 카드 수 (0058 · 0157). 조건이 없는 줄은 null */
export function branchProgress(evo: EvolutionDef, received: readonly string[] = []): { have: number; need: number } | null {
  if (!evo.branch || !evo.opens) return null;
  return { have: Math.min(branchCount(evo.branch, received), evo.opens.cards), need: evo.opens.cards };
}

function check(s: Growing, evo: EvolutionDef, received: readonly string[]): EvolveCheck {
  const level = levelOf(s.exp) >= evo.level;
  const deed = !evo.deed || s.deed >= evo.deed.n;
  const prog = branchProgress(evo, received);
  const open = !prog || prog.have >= prog.need;
  return { evo, level, deed, open, ok: level && deed && open };
}

/** 지금 단계에서 갈 수 있는 갈래마다의 검사. received = 이 판에서 이 정령이 받은 카드 id. 분기가 아니면 한 줄이에요. */
export function evolveChoices(s: Growing, received: readonly string[] = []): EvolveCheck[] {
  return evolutionsFrom(s).map((e) => check(s, e, received));
}

/** 링 · 버튼이 모두 이 결과만 읽어요. 갈래를 안 주면 갈 수 있는 갈래가 하나라도 있는지 봐요(없으면 첫 줄). */
export function canEvolve(s: Growing, received: readonly string[] = [], branch?: string): EvolveCheck | null {
  const all = evolveChoices(s, received).filter((c) => !branch || c.evo.branch === branch);
  return all.find((c) => c.ok) ?? all[0] ?? null;
}

/** 이 진화가 갈래 고르기인가 (같은 전 단계 줄이 둘 이상) */
export const isBranching = (s: Pick<RunSpirit, "id" | "stage">) => evolutionsFrom(s).length > 1;

export const isFinalStage = (s: Pick<RunSpirit, "id" | "stage">) => evolutionsFrom(s).length === 0;

/** 다음 진화의 자람 조건 (없으면 undefined) */
export const nextDeed = (s: Pick<RunSpirit, "id" | "stage">): DeedDef | undefined => evolutionsFrom(s)[0]?.deed;

/**
 * 키우기. 조건이 안 되면 그대로 돌려줘요. 갈래 고르기면 branch가 있어야 해요.
 * 최대 HP가 오른 만큼 지금 HP도 올라요.
 */
export function evolve(s: RunSpirit, received: readonly string[] = [], branch?: string): RunSpirit {
  if (isBranching(s) && !branch) return s;
  const c = canEvolve(s, received, branch);
  if (!c?.ok) return s;
  return withHpGain(s, { ...s, stage: c.evo.to, deed: 0, ...(c.evo.branch ? { branch: c.evo.branch } : {}) });
}

/** 전투에서 센 자람 조건을 더해요. 지금 진화 조건과 종류가 같을 때만 쌓여요. */
export function addDeed(s: RunSpirit, kind: DeedDef["kind"], n: number): RunSpirit {
  const deed = nextDeed(s);
  return deed && deed.kind === kind && n > 0 ? { ...s, deed: s.deed + n } : s;
}

// ───────────────────────── 해금 ─────────────────────────

/** 이 정령의 전용 해금 키 전체 (열리는 순서대로) */
export const SPIRIT_UNLOCK_STEPS = ["lv2", "lv3", "adult"] as const;

/** 이 정령의 전용 해금 키 중 지금 열린 것 */
export function spiritUnlocks(s: Pick<RunSpirit, "id" | "level" | "stage">): string[] {
  return [
    ...(s.level >= 2 ? [`${s.id}_lv2`] : []),
    ...(s.level >= 3 ? [`${s.id}_lv3`] : []),
    ...(isGrown(s) ? [`${s.id}_adult`] : []),
  ];
}

/** 이 판의 파티로 열린 해금 키 (카드 데이터의 unlock 값). act1Boss = 첫 보스를 가라앉힌 적이 있나 (정원) */
export function unlockKeys(party: readonly RunSpirit[], act1Boss = false): Set<string> {
  const keys = new Set<string>(["start"]);
  for (const s of party) for (const k of spiritUnlocks(s)) keys.add(k);
  if (party.some((s) => s.level >= 3)) keys.add("any_lv3");
  if (party.some((s) => isGrown(s))) keys.add("any_adult");
  if (act1Boss) keys.add("act1_boss");
  return keys;
}

/** 갈래 표시가 있는 성체 해금 카드 (갈래마다 하나) */
export const isBranchAdultCard = (card: CardDef) => !!card.branch && !!card.spirit && card.unlock === `${card.spirit}_adult`;

/** 해금됐나. 갈래 카드의 성체 해금은 고른 갈래의 카드만 열려요 (0027 갈래 고유 카드) */
export function isCardUnlocked(party: readonly RunSpirit[], card: CardDef, act1Boss = false): boolean {
  if (!unlockKeys(party, act1Boss).has(card.unlock)) return false;
  return !isBranchAdultCard(card) || party.find((s) => s.id === card.spirit)?.branch === card.branch;
}
