// 정원 상태 → 정령 관리 화면 데이터. 규칙 판단(키울 수 있나, 할 일)은 모두 core/garden 함수에 맡겨요.
import { C, CARDS, ELEMENT_NAME, GROWTH, ROLE_NAME, personalityDef, spiritDef } from "../../core/data";
import {
  canEvolve, canFeed, canReroll, episodesOpen, feedGain, gardenSpirit, isFinalStage, levelOf, levelProgress,
  spiritUnlocks, todos, toRunSpirit, type Garden, type GardenSpirit, type Todo,
} from "../../core/garden";
import { baseStat, levelHp, maxHpOf, round, stageBonus, stageRank } from "../../core/stats";
import { describeCard } from "../../core/text";
import { spiritArt } from "../spiritArt";
import { STAGES, type CardDef, type StatKey } from "../../core/types";
import { COPY, DEED_LABEL, STAGE_LABEL, TAB_LABEL } from "./copy";
import type {
  EpisodeVM, FactVM, GateVM, GrowthRowVM, RingVM, SpiritDetailVM, SpiritsVM, StatRowVM, TabVM, TileVM,
} from "./viewmodel";

/** 할 일 종류별 배지 기호 (정본: 새 카드 = g-cardnew) */
export const TODO_ICON: Record<Todo["kind"], string> = { evolve: "g-up", unlock: "g-cardnew", episode: "g-book" };

const STAT_ORDER: StatKey[] = ["hp", "power", "guard", "focus", "sync"];
const STAT_LABEL: Record<StatKey, string> = { hp: "HP", power: "파워", guard: "가드", focus: "포커스", sync: "싱크" };
const ELEMENT_ICON: Record<string, string> = { fire: "e-fire", water: "e-water", wind: "e-wind", none: "e-none" };
const ROLE_ICON: Record<string, string> = { attack: "i-sword", guard: "i-shield", support: "i-sprout" };

/** 이 정령의 전용 카드 (해금 키 순서: lv2, lv3, adult) */
function exclusiveCards(id: string): { card: CardDef; key: string; at: string }[] {
  const steps = [["lv2", "Lv2"], ["lv3", "Lv3"], ["adult", STAGE_LABEL.adult]] as const;
  return steps.flatMap(([step, at]) => {
    const key = `${id}_${step}`;
    return CARDS.filter((c) => c.unlock === key).map((card) => ({ card, key, at }));
  });
}

/** 다음 단계까지 진척 0~1. 레벨 문까지는 경험, 레벨이 되면 자람 조건 (0021 6절) */
function stageProgress(s: GardenSpirit): number {
  const check = canEvolve(s);
  if (!check) return 1;
  if (!check.level) {
    const into = GROWTH.evolutions.find((e) => e.spirit === s.id && e.to === s.stage);
    const start = into ? GROWTH.levels[into.level - 1] : 0;
    const end = GROWTH.levels[check.evo.level - 1];
    return Math.min(1, (s.exp - start) / (end - start));
  }
  const deed = check.evo.deed;
  return deed ? Math.min(1, s.deed / deed.n) : 1;
}

function ring(s: GardenSpirit): RingVM {
  if (isFinalStage(s)) return { kind: "final", value: 1 };
  if (canEvolve(s)?.ok) return { kind: "ready", value: 1 };
  return { kind: "progress", value: stageProgress(s) };
}

function art(s: GardenSpirit): SpiritDetailVM["art"] {
  const a = spiritArt(s.id, s.stage);
  return a && { key: a.body, frame: a.frame };
}

const chip = (s: GardenSpirit) => `${STAGE_LABEL[s.stage]} ${COPY.lv(levelOf(s.exp))}`;

function tile(s: GardenSpirit, deployed: boolean): TileVM {
  const def = spiritDef(s.id);
  return {
    id: s.id, name: def.name, element: ELEMENT_ICON[def.element], chip: chip(s), ring: ring(s),
    todo: todos(s).length, deployed, face: spiritArt(s.id, s.stage)?.face,
  };
}

function statRows(s: GardenSpirit): StatRowVM[] {
  const rs = toRunSpirit(s);
  const def = spiritDef(s.id);
  return STAT_ORDER.map((k) => {
    const base = k === "hp" ? def.stats.hp + levelHp(rs.level) : def.stats[k];
    const stage = stageBonus(rs, k);
    const total = k === "hp" ? maxHpOf(rs) : round(baseStat(rs, k));
    return { label: STAT_LABEL[k], base, stage, personality: total - base - stage, total };
  });
}

function growthRows(s: GardenSpirit): GrowthRowVM[] {
  const open = new Set(spiritUnlocks(s));
  const rs = toRunSpirit(s);
  const caster = { power: baseStat(rs, "power"), guard: baseStat(rs, "guard"), focus: baseStat(rs, "focus") };
  const cards = exclusiveCards(s.id);
  const rank = stageRank(s.stage);
  return STAGES.map((stage, i) => ({
    stage: STAGE_LABEL[stage],
    state: i < rank ? "done" : i === rank ? "now" : "next",
    // 유체 줄 = 레벨로 여는 카드, 성체 줄 = 성체 카드. 각성체는 전용 카드가 없어요 (0021 미루는 것)
    chips: cards
      .filter((c) => (stage === "baby" ? c.at !== STAGE_LABEL.adult : stage === "adult" && c.at === STAGE_LABEL.adult))
      .map(({ card, key, at }) => ({
        name: card.name, detail: describeCard(card, caster), at,
        open: open.has(key), fresh: open.has(key) && !s.seen.includes(key),
      })),
    notes: stage === "adult" ? [COPY.revealed] : [],
  }));
}

function gate(s: GardenSpirit): GateVM | undefined {
  const check = canEvolve(s);
  if (!check) return undefined;
  const deed = check.evo.deed;
  return {
    to: STAGE_LABEL[check.evo.to],
    level: { need: check.evo.level, ok: check.level },
    deed: deed && { label: DEED_LABEL[deed.kind], have: Math.min(s.deed, deed.n), need: deed.n, ok: check.deed },
    ready: check.ok,
  };
}

function episodes(s: GardenSpirit): EpisodeVM[] {
  const open = episodesOpen(s);
  return GROWTH.episodes.map((ep, i) => ({
    n: i + 1,
    state: i < s.episodes ? "seen" : i < open ? "open" : "locked",
    need: i < open ? undefined
      : s.affinity < ep.affinity ? `${COPY.affinity} ${ep.affinity}` : ep.stage && STAGE_LABEL[ep.stage],
  }));
}

function detail(g: Garden, s: GardenSpirit): SpiritDetailVM {
  const def = spiritDef(s.id);
  const level = levelOf(s.exp);
  const rows = statRows(s);
  const todo = todos(s);
  const cards = exclusiveCards(s.id);
  const open = new Set(spiritUnlocks(s));
  const progress = levelProgress(s.exp);
  const grown = s.stage !== "baby";
  const final = isFinalStage(s);
  const has = (kind: Todo["kind"]) => todo.some((t) => t.kind === kind);
  const tabs: TabVM[] = [
    { id: "overview", label: TAB_LABEL.overview },
    {
      id: "growth", label: TAB_LABEL.growth, count: COPY.lv(level),
      badge: has("evolve") ? TODO_ICON.evolve : has("unlock") ? TODO_ICON.unlock : undefined,
    },
    { id: "bond", label: TAB_LABEL.bond, count: `${s.episodes}/${GROWTH.episodes.length}`, badge: has("episode") ? TODO_ICON.episode : undefined },
  ];
  const facts: FactVM[] = [
    final
      ? { kind: "next", label: COPY.next, final: COPY.final }
      : { kind: "next", label: COPY.next, percent: Math.round(stageProgress(s) * 100), ready: has("evolve") },
    {
      kind: "cells", label: COPY.exclusive, total: cards.length,
      have: cards.filter((c) => open.has(c.key)).length, fresh: todo.filter((t) => t.kind === "unlock").length,
    },
    { kind: "bond", label: COPY.bond, have: s.episodes, total: GROWTH.episodes.length },
  ];
  const first = todo[0];
  if (first) {
    facts.push({
      kind: "todo", label: COPY.todo, badge: TODO_ICON[first.kind],
      tab: first.kind === "episode" ? "bond" : "growth",
      action: first.kind === "evolve" ? COPY.grow : first.kind === "unlock" ? COPY.newCard : COPY.newEpisode,
    });
  }
  // 호감도 막대의 목표: 아직 못 넘은 다음 문턱 (이미 넘었지만 단계가 모자란 이야기는 목록에서 보여요)
  const next = GROWTH.episodes.find((ep) => ep.affinity > s.affinity);
  return {
    id: s.id, name: def.name, art: art(s), stage: STAGE_LABEL[s.stage], level, final,
    tags: [
      { icon: ELEMENT_ICON[def.element], text: ELEMENT_NAME[def.element] },
      { icon: ROLE_ICON[def.role] ?? "i-sword", text: ROLE_NAME[def.role] ?? def.role },
    ],
    personality: grown ? personalityDef(s.personality).name : undefined,
    stats: rows.map((r) => ({ label: r.label, value: r.total, up: r.stage > 0 })),
    tabs,
    facts,
    overview: {
      rows,
      awaken: { name: COPY.awaken, desc: def.awaken.desc },
      personality: grown ? { name: personalityDef(s.personality).name, desc: personalityDef(s.personality).desc } : undefined,
      reroll: { shown: grown, can: canReroll(g, s), cost: GROWTH.reroll.cost },
    },
    growth: {
      level,
      exp: progress.next === undefined ? undefined : { have: s.exp - progress.from, need: progress.next - progress.from },
      rows: growthRows(s),
      gate: final ? undefined : gate(s),
    },
    bond: {
      affinity: s.affinity,
      next: next?.affinity,
      episodes: episodes(s),
      feed: { gain: feedGain(s), cost: GROWTH.feed.cost, can: canFeed(g) },
    },
  };
}

/** 화면 데이터. 고른 정령이 정원에 없으면 첫 정령을 보여 줘요 */
export function spiritsVM(g: Garden, selected: string): SpiritsVM {
  const sel = g.spirits.some((s) => s.id === selected) ? selected : g.spirits[0].id;
  const partySize = C.party_size;
  return {
    material: g.material,
    roster: g.spirits.map((s, i) => tile(s, i < partySize)),
    deployed: Math.min(partySize, g.spirits.length),
    partySize,
    selected: sel,
    detail: detail(g, gardenSpirit(g, sel)),
  };
}
