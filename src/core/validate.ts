// 데이터 파일 검사. 문제마다 "id: 내용" 한 줄을 돌려줘요.
import { CARD_OPS, CARD_TARGETS, ELEMENTS, RARITIES } from "./types";

type Row = Record<string, unknown>;

const isInt = (v: unknown, min = 0) => Number.isInteger(v) && (v as number) >= min;
const oneOf = (list: readonly string[], v: unknown) => typeof v === "string" && list.includes(v);

function opProblems(op: unknown, path: string): string[] {
  if (typeof op !== "object" || op === null) return [`${path}: 효과가 객체가 아니에요`];
  const o = op as Row;
  if (!(typeof o.op === "string" && o.op in CARD_OPS)) return [`${path}: 모르는 효과 ${String(o.op)}`];
  const out: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (k === "op" || k === "then") continue;
    if (typeof v !== "number" && typeof v !== "string") out.push(`${path}.${k}: 숫자나 글자가 아니에요`);
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
  if (!Array.isArray(c.effects) || !c.effects.length) out.push(`${id}: effects가 비었어요`);
  else c.effects.forEach((op, i) => out.push(...opProblems(op, `${id}.effects[${i}]`)));
  return out;
}
