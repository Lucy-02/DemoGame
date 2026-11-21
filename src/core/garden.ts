// 정원: 판 밖에 남는 것과 그 규칙 (0157). 성장(레벨 · 단계 · 갈래 · 장비)은 판 안에서 끝나고 정원에는 남지 않아요 (core/growth.ts · 0159).
// 정원에 남는 것: 떠날 수 있는 줄(깃든 정령), 완주로 연 성격, 보상 다시 뽑기. 순수 함수만 있고, 상태는 바꾸지 않고 새로 만들어 돌려줘요.
import { C, PERSONALITIES } from "./data";
import { freshSpirit, type BattleTier } from "./growth";
import { Rng } from "./rng";
import type { RunSpirit } from "./types";

export const GARDEN_VERSION = 2;

/** 정령 한 줄이 판 밖에 남기는 것 */
export interface GardenSpirit {
  id: string;
  /** 다음 판에 지니고 떠날 성격. 판이 끝날 때마다 새로 정해져요 (0157). 유체부터 보여요 (0033) */
  personality: string;
  /** 이 정령으로 완주해서 연 성격 (0157). 떠나기 전에 이 가운데서 고를 수 있어요 */
  cleared?: string[];
}

export interface Garden {
  version: number;
  spirits: GardenSpirit[];
  act1Boss: boolean;
  /** 깃들기 후보와 판마다의 성격을 뽑는 씨앗 (0053). 같은 정원이면 다시 켜도 같아요 */
  seed?: number;
  /** 끝낸 판 수 (져도 세요) */
  runs?: number;
  /** 아직 고르지 않은 깃들기 수 (0053) */
  joins?: number;
  /** 첫 판 가운데 둘째 정령이 깃들었는지 (0156). 그러면 첫 판 끝에는 더 주지 않아요 */
  midJoined?: boolean;
  /** 지난 판의 앞열. 출전 준비의 기본값이에요 (0076 14) */
  front?: string;
  /** 한 번 짚어 준 안내 (0095). 다시 나오지 않아요 */
  guides?: string[];
}

// ───────────────────────── 만들기 · 찾기 ─────────────────────────

/** 정령을 골라 만드는 정원(시험 · 자동 플레이). 정령마다 성격을 한 번 뽑아요. 같은 시드면 같은 정원이에요. 기본은 constants.default_party 셋이에요 */
export function newGarden(seed: number, ids: readonly string[] = C.default_party as string[]): Garden {
  const rng = new Rng(seed);
  return {
    version: GARDEN_VERSION,
    act1Boss: false,
    seed, runs: 0, joins: 0,
    spirits: ids.map((id) => ({ id, personality: rng.pick(PERSONALITIES).id })),
  };
}

/** 새로 하기의 정원 (0053): 시작 풀에서 무작위 하나로 시작해요 */
export function startGarden(seed: number): Garden {
  return newGarden(seed, [new Rng(seed ^ START_SALT).pick(C.start_pool as string[])]);
}

const START_SALT = 0x51ed;

/** 지금 깃들 수 있는 후보: 시작 풀에서 아직 없는 정령 가운데 둘 (0053). 고를 것이 없으면 빈 목록 */
export function joinOffer(g: Garden): string[] {
  return joinCandidates(g).map((c) => c.id);
}

/** 깃들기 후보 하나: 정령과 깃들면 가질 성격 */
export interface JoinCandidate {
  id: string;
  personality: string;
}

/**
 * 깃들기 후보와 후보마다의 성격 (0053 · 0076 12). 고르기 화면에서 성격을 보고 골라요.
 * 성격은 후보를 띄울 때 후보마다 따로 굴리고, 두 후보가 같은 성격을 받지 않아요. 같은 정원이면 다시 켜도 같아요.
 */
export function joinCandidates(g: Garden): JoinCandidate[] {
  if (!g.joins) return [];
  const left = (C.start_pool as string[]).filter((id) => !g.spirits.some((s) => s.id === id));
  const ids = new Rng((g.seed ?? 0) + g.spirits.length * 7919).shuffle(left).slice(0, 2);
  const personalities = new Rng((g.seed ?? 0) + g.spirits.length * 104729).shuffle(PERSONALITIES.map((p) => p.id));
  return ids.map((id, i) => ({ id, personality: personalities[i % personalities.length] }));
}

/** 후보 가운데 하나가 그 후보의 성격으로 깃들어요 */
export function join(g: Garden, id: string): Garden {
  const pick = joinCandidates(g).find((c) => c.id === id);
  if (!pick) return g;
  return {
    ...g, joins: (g.joins ?? 0) - 1,
    spirits: [...g.spirits, { id, personality: pick.personality }],
  };
}

/** 다음 판의 기본 앞열: 지난 판의 앞열, 없으면 첫 정령 (0076 14) */
export function defaultFront(g: Garden): string {
  return g.front && g.spirits.some((s) => s.id === g.front) ? g.front : g.spirits[0].id;
}

/** 이번 판의 앞열을 남겨요. 가진 정령만 돼요 */
export function setFront(g: Garden, id: string): Garden {
  return g.spirits.some((s) => s.id === id) && g.front !== id ? { ...g, front: id } : g;
}

/** 시작 풀에 아직 없는 정령이 남았을 때만 깃들기를 하나 더해요 */
const grantJoin = (g: Garden): Garden =>
  (C.start_pool as string[]).filter((id) => !g.spirits.some((s) => s.id === id)).length > (g.joins ?? 0) ? { ...g, joins: (g.joins ?? 0) + 1 } : g;

/**
 * 첫 판 가운데의 깃들기 (0156): 혼자 떠난 첫 판이 정한 층(run_pool.join_floor)을 마치면 둘째 정령이 깃들어요.
 * 첫 판이고, 정령이 하나뿐이고, 고를 깃들기가 없을 때만이에요. 고른 정령은 그 판에 바로 합류해요(GameSession)
 */
export function grantMidJoin(g: Garden): Garden {
  return !(g.runs ?? 0) && g.spirits.length === 1 && !g.joins && !g.midJoined ? { ...grantJoin(g), midJoined: true } : g;
}

/** 끝난 판 하나: 출전한 정령과 그 판의 성격, 완주했는지 */
export interface RunOutcome {
  party: readonly { id: string; personality: string }[];
  victory: boolean;
}

const PERSONALITY_SALT = 6151;

/**
 * 판이 끝났어요(져도). 첫 판을 끝내면 둘째 정령이 깃들어요 (0053). 판 가운데서 이미 깃들었으면 더 주지 않아요 (0156).
 * 완주했으면 출전한 정령마다 그 판의 성격이 열려요 (0157). 출전한 정령의 다음 판 성격은 여기서 새로 정해져요.
 */
export function endRun(g: Garden, done?: RunOutcome): Garden {
  const runs = (g.runs ?? 0) + 1;
  let out: Garden = runs === 1 && !g.midJoined ? grantJoin({ ...g, runs }) : { ...g, runs };
  if (!done) return out;
  const rng = new Rng((g.seed ?? 0) + runs * PERSONALITY_SALT);
  for (const p of done.party) {
    if (!out.spirits.some((s) => s.id === p.id)) continue;
    const next = rng.pick(PERSONALITIES).id;
    out = withSpirit(out, p.id, (s) => {
      const cleared = done.victory && !s.cleared?.includes(p.personality) ? [...(s.cleared ?? []), p.personality] : s.cleared;
      return { ...s, personality: next, ...(cleared ? { cleared } : {}) };
    });
  }
  return out;
}

/** 완주로 연 성격 가운데 하나를 다음 판의 성격으로 골라요 (0157). 열지 않은 성격이면 그대로예요 */
export function choosePersonality(g: Garden, id: string, personality: string): Garden {
  const s = g.spirits.find((x) => x.id === id);
  if (!s || s.personality === personality || !s.cleared?.includes(personality)) return g;
  return withSpirit(g, id, (x) => ({ ...x, personality }));
}

/** 완주한 줄 수 */
export const clearedLines = (g: Garden) => g.spirits.filter((s) => s.cleared?.length).length;

/** 판마다 받는 보상 다시 뽑기 수 (0157): 완주한 줄마다 하나, 상한까지. 어떤 정령으로 떠나든 같아요 */
export const rerollsOf = (g: Garden) => Math.min(C.reward.reroll_max, clearedLines(g));

export function gardenSpirit(g: Garden, id: string): GardenSpirit {
  const s = g.spirits.find((x) => x.id === id);
  if (!s) throw new Error(`정원에 없는 정령: ${id}`);
  return s;
}

const withSpirit = (g: Garden, id: string, f: (s: GardenSpirit) => GardenSpirit): Garden => ({
  ...g, spirits: g.spirits.map((s) => (s.id === id ? f(s) : s)),
});

// ───────────────────────── 판에서 받는 것 · 판으로 ─────────────────────────

/** 이긴 전투 하나. 첫 보스를 가라앉히면 정령이 하나 더 깃들어요 (0053). 경험은 판 안에서 받아요 (Run.grantBattle) */
export function grantBattle(g: Garden, tier: BattleTier): Garden {
  if (tier !== "boss" || g.act1Boss) return g;
  return { ...grantJoin(g), act1Boss: true };
}

/** 이 안내를 이미 짚었는지 (0095) */
export const hasGuide = (g: Garden, id: string) => !!g.guides?.includes(id);

/** 안내를 짚었다고 적어요. 다시 나오지 않아요 */
export const markGuide = (g: Garden, id: string): Garden => (hasGuide(g, id) ? g : { ...g, guides: [...(g.guides ?? []), id] });

/** 정원의 정령이 판을 떠날 때의 모습: 유체 Lv1, 정원에 적힌 성격, 꽉 찬 HP (0157) */
export function toRunSpirit(s: GardenSpirit): RunSpirit {
  return freshSpirit(s.id, s.personality);
}
