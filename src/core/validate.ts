// 데이터 파일 검사. 문제마다 "id: 내용" 한 줄을 돌려줘요.
import { EFFECTS } from "./battle/effects";
import { EQUIP_PASSIVES } from "./battle/passives";
import { CARD_TARGETS, ELEMENTS, EQUIP_RARITIES, EQUIP_STATS, OBTAINS, RARITIES, STAT_CONDITION_KINDS, STAT_MOD_OPS } from "./types";

type Row = Record<string, unknown>;

const isInt = (v: unknown, min = 0) => Number.isInteger(v) && (v as number) >= min;
const oneOf = (list: readonly string[], v: unknown) => typeof v === "string" && list.includes(v);

function opProblems(op: unknown, path: string): string[] {
  if (typeof op !== "object" || op === null) return [`${path}: 효과가 객체가 아니에요`];
  const o = op as Row;
  if (!(typeof o.op === "string" && o.op in EFFECTS)) return [`${path}: 모르는 효과 ${String(o.op)}`];
  const out: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (k === "op" || k === "then") continue;
    if (typeof v !== "number" && typeof v !== "string" && v !== true) out.push(`${path}.${k}: 숫자 · 글자 · true가 아니에요`);
  }
  if (o.op === "combo") {
    if (!Array.isArray(o.then) || !o.then.length) out.push(`${path}.then: 효과 목록이 비었어요`);
    else o.then.forEach((t, i) => out.push(...opProblems(t, `${path}.then[${i}]`)));
  }
  return out;
}

/** 카드 데이터 한 줄 검사. spiritIds는 startOwner가 가리킬 수 있는 정령 id예요. */
export function cardProblems(card: unknown, spiritIds: ReadonlySet<string>): string[] {
  if (typeof card !== "object" || card === null) return ["카드가 객체가 아니에요"];
  const c = card as Row;
  const id = typeof c.id === "string" && c.id ? c.id : "(id 없음)";
  const out: string[] = [];
  const need = (ok: boolean, what: string) => { if (!ok) out.push(`${id}: ${what}`); };
  need(typeof c.id === "string" && /^[a-z][a-z0-9_]*$/.test(c.id), "id는 소문자·숫자·_ 만 써요");
  need(!("name" in c) && !("nameEn" in c), "이름은 src/data/locales에 적어요");
  need(oneOf(ELEMENTS, c.element), `모르는 속성 ${String(c.element)}`);
  need(oneOf(RARITIES, c.rarity), `모르는 등급 ${String(c.rarity)}`);
  need(oneOf(CARD_TARGETS, c.target), `모르는 대상 ${String(c.target)}`);
  need(typeof c.role === "string" && c.role.length > 0, "role이 없어요");
  need(isInt(c.cost), "cost는 0 이상 정수예요");
  need(isInt(c.ms), "ms(기본 시간)는 0 이상 정수예요");
  need(typeof c.unlock === "string" && c.unlock.length > 0, "unlock이 없어요");
  need(c.start === undefined || isInt(c.start, 1), "start는 1 이상 정수예요");
  need(c.exhaust === undefined || typeof c.exhaust === "boolean", "exhaust는 true/false예요");
  need(c.startOwner === undefined || spiritIds.has(c.startOwner as string), `없는 정령 ${String(c.startOwner)}`);
  need(c.startEach === undefined || isInt(c.startEach, 1), "startEach는 1 이상 정수예요");
  need(c.spirit === undefined || spiritIds.has(c.spirit as string), `없는 전용 정령 ${String(c.spirit)}`);
  need(c.obtain === undefined || oneOf(OBTAINS, c.obtain), `모르는 얻는 곳 ${String(c.obtain)}`);
  if (!Array.isArray(c.effects) || !c.effects.length) out.push(`${id}: effects가 비었어요`);
  else c.effects.forEach((op, i) => out.push(...opProblems(op, `${id}.effects[${i}]`)));
  return out;
}

function tierProblems(tier: unknown, path: string): string[] {
  if (typeof tier !== "object" || tier === null) return [`${path}: 층이 객체가 아니에요`];
  const t = tier as Row;
  const out: string[] = [];
  const stats = t.stats === undefined ? [] : t.stats;
  const effects = t.effects === undefined ? [] : t.effects;
  if (!Array.isArray(stats)) out.push(`${path}.stats: 목록이 아니에요`);
  else stats.forEach((m, i) => {
    const q = `${path}.stats[${i}]`;
    if (typeof m !== "object" || m === null) return out.push(`${q}: 보정이 객체가 아니에요`);
    const r = m as Row;
    if (!oneOf(EQUIP_STATS, r.stat)) out.push(`${q}: 모르는 수치 ${String(r.stat)}`);
    if (!oneOf(STAT_MOD_OPS, r.op)) out.push(`${q}: 모르는 연산 ${String(r.op)}`);
    if (typeof r.value !== "number") out.push(`${q}: value는 숫자예요`);
    if (r.when !== undefined) {
      const w = r.when as Row | null;
      if (typeof w !== "object" || w === null || !oneOf(STAT_CONDITION_KINDS, w.k)) out.push(`${q}.when: 모르는 조건`);
      else if (w.k === "hpBelow" && typeof w.ratio !== "number") out.push(`${q}.when: ratio는 숫자예요`);
    }
  });
  if (!Array.isArray(effects)) out.push(`${path}.effects: 목록이 아니에요`);
  else effects.forEach((e, i) => {
    const q = `${path}.effects[${i}]`;
    const r = (typeof e === "object" && e !== null ? e : {}) as Row;
    if (!(typeof r.passive === "string" && r.passive in EQUIP_PASSIVES)) out.push(`${q}: 모르는 장비 효과 ${String(r.passive)}`);
    if (typeof r.value !== "number") out.push(`${q}: value는 숫자예요`);
  });
  return out;
}

/** 장비 데이터 한 줄 검사 */
export function equipProblems(equip: unknown, spiritIds: ReadonlySet<string>, cardIds?: ReadonlySet<string>): string[] {
  if (typeof equip !== "object" || equip === null) return ["장비가 객체가 아니에요"];
  const e = equip as Row;
  const id = typeof e.id === "string" && e.id ? e.id : "(id 없음)";
  const out: string[] = [];
  const need = (ok: boolean, what: string) => { if (!ok) out.push(`${id}: ${what}`); };
  need(typeof e.id === "string" && /^[a-z][a-z0-9_]*$/.test(e.id), "id는 소문자·숫자·_ 만 써요");
  need(!("name" in e), "이름은 src/data/locales에 적어요");
  need(e.owner === null || spiritIds.has(e.owner as string), `없는 전용 정령 ${String(e.owner)}`);
  need(oneOf(EQUIP_RARITIES, e.rarity), `모르는 희귀도 ${String(e.rarity)}`);
  need(e.rarity !== "exclusive" || e.owner !== null, "전용 무기에는 전용 정령이 있어요");
  need(e.rarity === "exclusive" || e.owner === null, "범용 · 보스 장비는 누구나 받아요");
  if (!Array.isArray(e.tiers) || !e.tiers.length) out.push(`${id}: tiers가 비었어요`);
  else {
    e.tiers.forEach((t, i) => out.push(...tierProblems(t, `${id}.tiers[${i}]`)));
    e.tiers.forEach((t, i) => {
      const n = ((t as Row)?.stats as unknown[] | undefined)?.length ?? 0;
      const k = ((t as Row)?.effects as unknown[] | undefined)?.length ?? 0;
      need(n <= 2 && k <= 1, `tiers[${i}]: 능력치 보정은 2개, 효과는 1개까지예요`);
    });
  }
  if (e.downside !== undefined) out.push(...tierProblems(e.downside, `${id}.downside`));
  need(e.downside === undefined || e.rarity === "boss", "대가는 보스 장비에만 있어요");
  if (e.signature !== undefined) {
    const sg = e.signature as Row;
    const n = Array.isArray(e.tiers) ? e.tiers.length : 0;
    need(e.rarity === "exclusive", "대표 카드 변형은 전용 무기에만 있어요");
    const shaped = typeof sg === "object" && sg !== null && typeof sg.card === "string" && typeof sg.techniques === "object" && sg.techniques !== null;
    need(shaped, "signature는 {card, techniques}예요");
    if (shaped) {
      const known = (c: unknown) => typeof c === "string" && (!cardIds || cardIds.has(c));
      need(known(sg.card), `없는 대표 카드 ${String(sg.card)}`);
      for (const [branch, list] of Object.entries(sg.techniques as Row)) {
        need(Array.isArray(list) && list.length === n, `signature.techniques.${branch}: 공명 단계마다 기술 카드가 하나씩 있어요`);
        if (Array.isArray(list)) for (const c of list) need(known(c), `signature.techniques.${branch}: 없는 카드 ${String(c)}`);
      }
    }
  }
  if (e.opensBranch !== undefined) {
    const ob = e.opensBranch as Row;
    need(typeof ob === "object" && ob !== null && spiritIds.has(ob.spirit as string) && typeof ob.branch === "string", "opensBranch는 {spirit, branch}예요");
  }
  return out;
}
