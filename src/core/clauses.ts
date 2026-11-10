// 효과 문구 조각 (결정 0022, design/canon/text/TEXT_RULES.md 효과문):
// 합니다체 완결문, 어순 [조건] [대상] [대상물을] [수] [동사]. 숫자 뒤에는 조사를 붙이지 않아요.
import { andThen, polite } from "./korean";

/** 효과 한 문장. `core`는 동사 줄기로 끝나요("피해를 6 입히"). */
export interface Clause {
  to: string;
  core: string;
  /** 이 문장 뒤에 붙는 완결문 (조건·예외) */
  after?: string;
}
export type Part = Clause | string;

const sentence = (c: Clause) => `${c.to}${polite(c.core)}.${c.after ? ` ${c.after}` : ""}`;

/** 문장들을 이어요. 대상이 같은 연속 문장만 "~고"로 묶어 대상을 한 번만 써요 (효과문 규칙 R10). */
export function join(parts: Part[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];
    if (typeof p === "string") {
      out.push(p);
      i++;
      continue;
    }
    let core = p.core;
    let last = p;
    while (i + 1 < parts.length) {
      const n = parts[i + 1];
      if (typeof n === "string" || !p.to || n.to !== p.to || last.after) break;
      core = `${andThen(core)} ${n.core}`;
      last = n;
      i++;
    }
    out.push(sentence({ to: p.to, core, after: last.after }));
    i++;
  }
  return out.join(" ");
}

/** 카드 한 장의 문구를 만들 때 효과 핸들러가 받는 것 */
export interface TextContext {
  /** 적에게 가는 효과의 대상 ("모든 적에게 " 또는 빈 문자열) */
  foe: string;
  /** "대상의" 또는 "모든 적의" */
  foeOf: string;
  /** 카드 주인에게만 가는 효과의 주어. 다른 아군을 고르는 카드에서만 "이 정령이 " */
  me: string;
  /** 아군 회복처럼 수치가 바뀌는 효과의 대상 ("아군 하나의 " 등) */
  allyOf: string;
  /** 아군에게 가는 효과의 [대상, 동사]를 붙인 문장 */
  ally: (op: "block" | "empower" | "thorns", what: string) => Clause;
  /** 시전 정령 능력치로 보정한 수치 */
  sc: (v: number, k: "power" | "guard" | "focus") => number;
  /** 타격 수치 (강화 포함) */
  dmg: (v: number) => number;
  /** 카드의 주 수치: 첫 호출에만 성장분을 더해요 */
  main: (v: number) => number;
}
