// 보여 줄 정령들(Roster) → 정령 관리 화면 데이터. 규칙 판단(키울 수 있나)은 모두 core/growth 함수에 맡겨요.
// 판 밖에서는 떠날 때의 모습(유체 Lv 1), 판 안에서는 그 판에서 자란 모습이에요 (0157).
import { C, CARDS, ELEMENT_NAME, GROWTH, ROLE_NAME, personalityDef, spiritDef } from "../../core/data";
import { canEvolve, evolveChoices, branchProgress, isBranchAdultCard, isFinalStage, levelProgress, spiritUnlocks } from "../../core/growth";
import { baseStat, equipSlots, levelHp, maxHpOf, round, stageBonus, stageRank } from "../../core/stats";
import { describeCard } from "../../core/text";
import { ELEMENT_ICON, ROLE_ICON } from "../faces";
import { awakenedPuppet } from "../puppet/puppetIds";
import { equipSheet, equipVM } from "../run/fromCore";
import { spiritArt } from "../spiritArt";
import { STAGES, type CardDef, type RunSpirit, type Stage, type StatKey } from "../../core/types";
import type { Roster } from "./roster";
import { COPY, DEED_LABEL, STAGE_LABEL, TAB_LABEL } from "./copy";
import { MOCK_ELEMENT_ICON, type Mockup } from "./mockups";
import { tokens } from "../../design/tokens";
import type {
  BranchPickVM, FactVM, GateVM, GrowthRowVM, RingVM, SpiritDetailVM, SpiritsVM, StatRowVM, TabVM, TileVM,
} from "./viewmodel";

/** 할 일 배지 기호: 키우기 */
export const TODO_ICON = "g-up";

/** 화면 안에서 정령 하나와 그 정령이 이 판에서 받은 카드 */
interface Shown {
  s: RunSpirit;
  received: readonly string[];
}

const shown = (r: Roster, s: RunSpirit): Shown => ({ s, received: r.received[s.id] ?? [] });
const ready = ({ s, received }: Shown) => !!canEvolve(s, received)?.ok;

const STAT_ORDER: StatKey[] = ["hp", "power", "guard", "focus", "speed"];
const STAT_LABEL: Record<StatKey, string> = { hp: "HP", power: "파워", guard: "가드", focus: "포커스", speed: "스피드" };
export { ROLE_ICON };

/** 이 정령의 전용 카드 (해금 키 순서: lv2, lv3, adult) */
function exclusiveCards(id: string): { card: CardDef; key: string; at: string }[] {
  const steps = [["lv2", "Lv2"], ["lv3", "Lv3"], ["adult", STAGE_LABEL.adult]] as const;
  return steps.flatMap(([step, at]) => {
    const key = `${id}_${step}`;
    return CARDS.filter((c) => c.unlock === key).map((card) => ({ card, key, at }));
  });
}

/** 다음 단계까지 진척 0~1. 레벨 문까지는 경험, 레벨이 되면 자람 조건 (0021 6절) */
function stageProgress({ s, received }: Shown): number {
  const check = canEvolve(s, received);
  if (!check) return 1;
  if (!check.level) {
    const into = GROWTH.evolutions.find((e) => e.spirit === s.id && e.to === s.stage);
    const start = into ? GROWTH.levels[into.level - 1] : 0;
    const end = GROWTH.levels[check.evo.level - 1];
    return Math.max(0, Math.min(1, (s.exp - start) / (end - start)));
  }
  const deed = check.evo.deed;
  return deed ? Math.min(1, s.deed / deed.n) : 1;
}

function ring(x: Shown): RingVM {
  if (isFinalStage(x.s)) return { kind: "final", value: 1 };
  if (ready(x)) return { kind: "ready", value: 1 };
  return { kind: "progress", value: stageProgress(x) };
}

function art(id: string, stage: Stage): SpiritDetailVM["art"] {
  const a = spiritArt(id, stage);
  // 각성체는 움직이는 퍼핏(라투디)이 있으면 그걸로 그려요. 일러스트는 퍼핏을 불러오는 동안·색 번짐에 써요
  const puppet = stage === "awakened" ? awakenedPuppet(id) : undefined;
  return a && { key: a.body, frame: a.frame, fit: a.fit, ...(puppet ? { puppet } : {}) };
}

function face(id: string, stage: Stage): TileVM["face"] {
  const a = spiritArt(id, stage);
  return a?.crop && { key: a.body, crop: a.crop };
}

const chip = (s: RunSpirit) => `${STAGE_LABEL[s.stage]} ${COPY.lv(s.level)}`;

function tile(x: Shown, deployed: boolean): TileVM {
  const { s } = x;
  const def = spiritDef(s.id);
  return {
    id: s.id, name: def.name, element: ELEMENT_ICON[def.element], chip: chip(s), ring: ring(x),
    todo: ready(x) ? 1 : 0, deployed, face: face(s.id, s.stage),
  };
}

function statRows(rs: RunSpirit): StatRowVM[] {
  const def = spiritDef(rs.id);
  return STAT_ORDER.map((k) => {
    const base = k === "hp" ? def.stats.hp + levelHp(rs.level) : def.stats[k];
    const stage = stageBonus(rs, k);
    const valueOf = (x: typeof rs) => (k === "hp" ? maxHpOf(x) : round(baseStat(x, k)));
    const total = valueOf(rs), bare = valueOf({ ...rs, equipment: [] });
    return { label: STAT_LABEL[k], base, stage, personality: bare - base - stage, equip: total - bare, total };
  });
}

function growthRows(rs: RunSpirit): GrowthRowVM[] {
  const open = new Set(spiritUnlocks(rs));
  const caster = { power: baseStat(rs, "power"), guard: baseStat(rs, "guard"), focus: baseStat(rs, "focus") };
  const cards = exclusiveCards(rs.id);
  const rank = stageRank(rs.stage);
  return STAGES.map((stage, i) => ({
    stage: STAGE_LABEL[stage],
    state: i < rank ? "done" : i === rank ? "now" : "next",
    // 유체 줄 = 레벨로 여는 카드, 성체 줄 = 성체 카드. 각성체는 전용 카드가 없어요 (0021 미루는 것)
    chips: cards
      .filter((c) => (stage === "baby" ? c.at !== STAGE_LABEL.adult : stage === "adult" && c.at === STAGE_LABEL.adult))
      .map(({ card, key, at }) => ({ name: card.name, detail: describeCard(card, caster), at, open: open.has(key) })),
    notes: stage === "adult" ? [COPY.personalityOn] : [],
  }));
}

function gate({ s, received }: Shown): GateVM | undefined {
  const check = canEvolve(s, received);
  if (!check) return undefined;
  const deed = check.evo.deed;
  return {
    to: STAGE_LABEL[check.evo.to],
    level: { need: check.evo.level, ok: check.level },
    deed: deed && { label: DEED_LABEL[deed.kind], have: Math.min(s.deed, deed.n), need: deed.n, ok: check.deed },
    ready: check.ok,
  };
}

/** 지닌 장비 칸: 단계의 칸 수만큼, 빈 칸은 null */
function equipSlotsOf(rs: RunSpirit): SpiritDetailVM["equip"] {
  return Array.from({ length: equipSlots(rs.stage) }, (_, i) => {
    const e = rs.equipment[i];
    return e ? { item: equipVM(e, rs.stage), tip: { sheet: equipSheet(e, rs) } } : null;
  });
}

function detail(x: Shown): SpiritDetailVM {
  const { s } = x;
  const def = spiritDef(s.id);
  const rows = statRows(s);
  const cards = exclusiveCards(s.id);
  const open = new Set(spiritUnlocks(s));
  const progress = levelProgress(s.exp);
  const grown = s.stage !== "baby";
  const final = isFinalStage(s);
  const grow = ready(x);
  const tabs: TabVM[] = [
    { id: "overview", label: TAB_LABEL.overview },
    { id: "growth", label: TAB_LABEL.growth, count: COPY.lv(s.level), badge: grow ? TODO_ICON : undefined },
  ];
  const facts: FactVM[] = [
    final
      ? { kind: "next", label: COPY.next, final: COPY.final }
      : { kind: "next", label: COPY.next, percent: Math.round(stageProgress(x) * 100), ready: grow },
    { kind: "cells", label: COPY.exclusive, total: cards.length, have: cards.filter((c) => open.has(c.key)).length },
  ];
  if (grow) facts.push({ kind: "todo", label: COPY.todo, badge: TODO_ICON, tab: "growth", action: COPY.grow });
  return {
    id: s.id, name: def.name, art: art(s.id, s.stage), stage: STAGE_LABEL[s.stage], level: s.level, final,
    tags: [
      { icon: ELEMENT_ICON[def.element], text: ELEMENT_NAME[def.element] },
      { icon: ROLE_ICON[def.role] ?? "role-attack", text: ROLE_NAME[def.role] ?? def.role },
    ],
    personality: personalityDef(s.personality).name,
    stats: rows.map((r) => ({ label: r.label, value: r.total, up: r.stage > 0 })),
    equip: equipSlotsOf(s),
    tabs,
    facts,
    overview: {
      rows,
      release: { name: COPY.release, desc: def.release.desc },
      personality: {
        name: personalityDef(s.personality).name, desc: personalityDef(s.personality).desc,
        note: grown ? undefined : COPY.personalityLater,
      },
    },
    growth: {
      level: s.level,
      exp: progress.next === undefined ? undefined : { have: s.exp - progress.from, need: progress.next - progress.from },
      rows: growthRows(s),
      gate: final ? undefined : gate(x),
    },
  };
}

// ───────────────────────── 목업 (파일럿 3종 밖) ─────────────────────────

/** 목업 정령과 지금 보여 줄 단계 */
export interface MockView {
  list: readonly Mockup[];
  stage(id: string): Stage;
}

const mockIcon = (m: Mockup) => MOCK_ELEMENT_ICON[m.element] ?? "el-none";

function mockTile(m: Mockup, stage: Stage): TileVM {
  const rank = stageRank(stage);
  return {
    id: m.id, name: m.name, element: mockIcon(m), chip: STAGE_LABEL[stage],
    ring: stage === "awakened" ? { kind: "final", value: 1 } : { kind: "progress", value: rank / (STAGES.length - 1) },
    todo: 0, deployed: false, face: face(m.id, stage),
  };
}

function mockDetail(m: Mockup, stage: Stage): SpiritDetailVM {
  const rank = stageRank(stage);
  return {
    id: m.id, name: m.name, art: art(m.id, stage), stage: STAGE_LABEL[stage], final: stage === "awakened", mock: true,
    tags: [{ icon: mockIcon(m), text: m.element }, { text: COPY.mock }],
    stats: STAT_ORDER.map((k) => ({ label: STAT_LABEL[k], up: false })),
    equip: [],
    tabs: [
      { id: "overview", label: TAB_LABEL.overview },
      { id: "growth", label: TAB_LABEL.growth },
    ],
    facts: [{ kind: "next", label: COPY.next, final: COPY.undecided }],
    overview: {
      rows: [],
      release: { name: COPY.release, desc: COPY.undecided },
    },
    growth: {
      rows: STAGES.map((st, i) => ({
        stage: STAGE_LABEL[st], state: i < rank ? "done" : i === rank ? "now" : "next", pick: st,
        chips: [], notes: i === rank ? [] : [COPY.pickStage],
      })),
    },
  };
}

/** 목업 가운데 가진 정령이 아닌 것만. 가진 정령은 늘 실제 값으로 보여요 */
export const mockList = (r: Roster, mocks?: MockView) => mocks?.list.filter((m) => !r.spirits.some((s) => s.id === m.id)) ?? [];

/** 화면 데이터. 고른 정령이 가진 정령(또는 목업)에 없으면 첫 정령을 보여 줘요. 목업은 가진 정령 뒤에 붙어요 */
export function spiritsVM(r: Roster, selected: string, mocks?: MockView): SpiritsVM {
  const list = mockList(r, mocks);
  const mock = list.find((m) => m.id === selected);
  const sel = mock || r.spirits.some((s) => s.id === selected) ? selected : r.spirits[0].id;
  const partySize = C.party_size;
  return {
    roster: [
      ...r.spirits.map((s, i) => tile(shown(r, s), i < partySize)),
      ...list.map((m) => mockTile(m, mocks!.stage(m.id))),
    ],
    deployed: Math.min(partySize, r.spirits.length),
    partySize,
    selected: sel,
    detail: mock ? mockDetail(mock, mocks!.stage(mock.id)) : detail(shown(r, r.spirits.find((s) => s.id === sel)!)),
  };
}

// ───────────────────────── 갈래 고르기 (0047 S15 · 라운드 G1) ─────────────────────────

/** 갈래 창 능력치 줄: HP · 파워 · 가드 · 포커스 (P1 f7). 색은 능력치 뜻 색(0050), HP는 치료 연두 */
const BRANCH_STATS: { k: StatKey; icon: string; color: string }[] = [
  { k: "hp", icon: "fx-heal", color: tokens.provisional.palette.ok },
  { k: "power", icon: "fx-damage", color: tokens.provisional.palette.stat.power },
  { k: "guard", icon: "fx-block", color: tokens.provisional.palette.stat.guard },
  { k: "focus", icon: "i-spark", color: tokens.provisional.palette.stat.focus },
];

/** 갈래 고르기 창 데이터. 갈래 조건은 이 판에서 그 정령이 받은 카드로 세요 (0058 · 0157). 갈래 고르기가 아니면 undefined */
export function branchPickVM(r: Roster, id: string, from: BranchPickVM["from"], selected?: string): BranchPickVM | undefined {
  const now = r.spirits.find((x) => x.id === id);
  if (!now) return undefined;
  const s = now, received = r.received[id] ?? [];
  const choices = evolveChoices(s, received);
  if (choices.length < 2) return undefined;
  const def = spiritDef(id);
  const valueOf = (rs: typeof now, k: StatKey) => (k === "hp" ? maxHpOf(rs) : round(baseStat(rs, k)));
  const branches = choices.map((c, i) => {
    const after = { ...now, stage: c.evo.to, branch: c.evo.branch };
    const prog = branchProgress(c.evo, received);
    return {
      id: c.evo.branch!, n: i + 1, name: COPY.branchName, role: ROLE_ICON[def.role], open: c.open,
      stats: BRANCH_STATS.map(({ k }) => {
        const value = valueOf(after, k);
        return { value, gain: value - valueOf(now, k) };
      }),
      cards: CARDS.filter((card) => card.spirit === id && card.branch === c.evo.branch && isBranchAdultCard(card)).map((card) => ({ key: card.id, name: card.name })),
      cond: c.open ? undefined : { level: { need: c.evo.level, ok: c.level }, cards: prog ?? { have: 0, need: 0 } },
    };
  });
  const firstOpen = branches.findIndex((b) => b.open);
  const pick = selected ? branches.findIndex((b) => b.id === selected && b.open) : -1;
  return {
    spiritId: id, name: def.name, level: COPY.lv(s.level), element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, role: ROLE_ICON[def.role],
    personality: personalityDef(s.personality).name, face: face(id, s.stage), from,
    now: BRANCH_STATS.map(({ k, icon, color }) => ({ icon, color, value: valueOf(now, k) })),
    branches, selected: pick >= 0 ? pick : firstOpen >= 0 ? firstOpen : undefined,
    condRow: branches.some((b) => !b.open),
  };
}
