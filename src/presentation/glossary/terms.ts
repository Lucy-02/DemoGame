// 용어 사전 (0102): 용어 이름 · 기호 · 풀이가 한 곳에 있어요. 전투의 기호 호버, 카드 효과문의 용어 밑줄, 용어 모음 창이 여기서 읽어요.
// 풀이는 합니다체 1~2문장: 첫 문장은 무엇이 일어나는지(what), 둘째는 언제 줄거나 사라지는지(when). 걸린 쪽(주어)은 생략해요 (TEXT_RULES 2절).
// 숫자는 규칙 데이터(constants.json)에서 읽어요. 이름은 임시이고, 기호가 없는 용어는 자리만 둬요 (TODO_ICON).
import { C } from "../../core/data";

export type TermGroup = "status" | "card" | "battle";

export interface Term {
  id: string;
  name: string;
  group: TermGroup;
  /** 정본 기호 id. 없으면 점선 칸 (TODO_ICON) */
  icon?: string;
  what: string;
  when?: string;
  /** 효과문에서 점선 밑줄로 표시하는 용어 */
  inText?: boolean;
}

const pct = (mult: number) => Math.round(Math.abs(mult - 1) * 100);
const CHILL = C.chill_threshold as Record<"normal" | "elite" | "boss", number>;
const START_TURN = "내 턴 시작 시 사라집니다.";
const EACH_TURN = "턴이 끝날 때마다 1 줄어듭니다.";

export const TERMS: readonly Term[] = [
  { id: "burn", name: "화상", group: "status", icon: "kw-burn", inText: true, what: "턴이 끝날 때 화상 수치만큼 피해를 입습니다.", when: "그 뒤 화상이 절반으로 줄어듭니다." },
  { id: "chill", name: "냉기", group: "status", icon: "kw-chill", inText: true, what: "일정 수치까지 쌓이면 빙결되고 냉기가 0이 됩니다.", when: `일반 적은 ${CHILL.normal}, 정예는 ${CHILL.elite}, 보스는 ${CHILL.boss}에서 빙결됩니다.` },
  { id: "freeze", name: "빙결", group: "status", icon: "kw-freeze", inText: true, what: "다음 행동이 늦어집니다.", when: "차징은 끊기지 않습니다." },
  { id: "vuln", name: "취약", group: "status", icon: "kw-vuln", inText: true, what: "받는 피해가 늘어납니다.", when: EACH_TURN },
  { id: "weak", name: "약화", group: "status", icon: "kw-weak", inText: true, what: `주는 피해가 ${pct(C.weak_mult)}% 줄어듭니다.`, when: EACH_TURN },
  { id: "thorns", name: "반격", group: "status", icon: "kw-thorns", inText: true, what: "적의 공격에 맞을 때마다 반격 수치만큼 피해를 되돌립니다.", when: START_TURN },
  { id: "taunt", name: "도발", group: "status", icon: "kw-taunt", inText: true, what: "적이 하나만 노리는 공격을 대신 받습니다.", when: START_TURN },
  { id: "empower", name: "강화", group: "status", icon: "kw-strength", what: "이번 턴에 입히는 타격 피해가 수치만큼 늘어납니다.", when: START_TURN },

  { id: "block", name: "방어도", group: "card", icon: "fx-block", what: "받는 피해를 방어도만큼 막습니다.", when: START_TURN },
  { id: "wall", name: "벽", group: "card", what: "벽으로 얻은 방어도는 다른 아군이 받는 피해도 대신 막습니다." },
  { id: "exhaust", name: "소멸", group: "card", icon: "prop-exhaust", inText: true, what: "사용하면 이번 전투에서 사라집니다." },
  { id: "persist", name: "지속", group: "card", icon: "prop-persist", what: "사용하면 전투가 끝날 때까지 효과가 이어집니다." },
  { id: "hold", name: "품기", group: "card", what: "품은 카드는 다음 턴에 손으로 돌아옵니다.", when: `돌아온 카드는 효과가 ${pct(C.hold_mult)}% 늘고 더 빨리 끝납니다.` },
  { id: "fall", name: "낙하", group: "card", what: `적에게 새긴 별이 ${C.star_threshold}개 모이면 낙하 카드를 고릅니다.`, when: "고르고 쓰지 않은 낙하는 턴이 끝날 때 사라집니다." },

  { id: "charge", name: "차징", group: "battle", icon: "kw-charge", what: "적이 큰 행동을 준비합니다.", when: "브레이크로만 끊을 수 있습니다." },
  { id: "break", name: "브레이크", group: "battle", icon: "kw-break", inText: true, what: "차징 중인 적의 행동을 끊습니다." },
  { id: "opening", name: "허점", group: "battle", what: `적이 행동하기 직전에 끝난 공격은 피해가 ${pct(C.opening_mult)}% 늘어납니다.` },
  { id: "gap", name: "틈", group: "battle", what: "큰 차징을 끊거나 늦추거나 몰아 치면 열립니다.", when: `틈이 열린 적은 모든 공격을 허점으로 받고 피해를 ${pct(C.gap.dmg_mult)}% 더 받습니다.` },
  { id: "weakness", name: "약점", group: "battle", what: `약점 속성의 공격은 피해가 ${pct(C.affinity_weak)}% 늘어납니다.`, when: `저항하는 속성의 공격은 ${pct(C.affinity_resist)}% 줄어듭니다.` },
  { id: "front", name: "앞열", group: "battle", icon: "g-flag", what: "적이 앞열을 노리는 공격을 받습니다." },
  { id: "release", name: "해방", group: "battle", what: `각성체가 전투마다 한 번 ${C.release_duration}턴 동안 변신합니다.` },
  { id: "downed", name: "쓰러짐", group: "battle", what: "그 전투 동안 카드가 봉인됩니다.", when: `전투가 끝나면 HP ${C.downed_return_hp}로 돌아옵니다.` },
];

export const GROUPS: readonly TermGroup[] = ["status", "card", "battle"];

const BY_ICON = new Map(TERMS.filter((t) => t.icon).map((t) => [t.icon!, t]));

/** 기호 → 용어. 사전에 없는 기호는 풀이를 띄우지 않아요 */
export const termOfIcon = (icon: string): Term | undefined => BY_ICON.get(icon);

/** 효과문에서 밑줄로 표시할 용어 이름 */
export const TEXT_TERMS: readonly string[] = TERMS.filter((t) => t.inText).map((t) => t.name);

/** 풀이 전체: 한두 문장을 한 칸 띄워 이어요 */
export const termBody = (t: Term): string => (t.when ? `${t.what} ${t.when}` : t.what);
