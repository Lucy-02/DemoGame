// 손패 카드를 낼 때의 대상 규칙과 결과 미리보기 (예시, 정본 장면 손패 기준).
// 대상 규칙은 카드 설명 글("적 하나에게", "아군 하나에게", "무작위 적에게")에서 옮겼어요.
// 결과 값은 정본에 적힌 물방울 휘갈기기 → 거북 한 가지만 정본이고, 나머지는 카드 설명으로 셈한 자리 채움이에요.
// 카드 효과·밸런스가 정해지면 session 층이 계산해서 채우고, 이 파일은 지워요.
import type { OutcomeVM, PlayVM } from "../viewmodel";

const enemy = { kind: "pick", side: "enemy" } as const;
const ally = { kind: "pick", side: "ally" } as const;
const none = [undefined, undefined, undefined];

/** 정본 H1 (.fld-pv): 물방울 휘갈기기로 거북을 때리면 실드 2칸을 다 깨서 해일 차징이 끊겨요 */
export const canonDropsOnTurtle: OutcomeVM = {
  enemies: { 2: { hits: [3, 3], block: { from: 4, to: 0 }, hp: { from: 41, to: 39 }, shieldBreak: 2, cut: true } },
  incoming: [{ from: 18, to: 0 }, { from: 18, to: 0 }, { from: 30, to: 12 }],
};

export const examplePlays: Record<string, PlayVM> = {
  pierce: { target: enemy },
  breeze: { target: ally },
  claw: { target: enemy },
  heat: { target: enemy },
  counter: { target: enemy },
  zap: { target: enemy },
  drops: {
    target: enemy,
    outcomes: {
      // 자리 채움: 피해 3 × 2, 방어도부터 깎아요
      0: { enemies: { 0: { hits: [3, 3], block: { from: 4, to: 0 }, hp: { from: 18, to: 16 } } }, incoming: none },
      1: { enemies: { 1: { hits: [3, 3], hp: { from: 12, to: 6 } } }, incoming: none },
      2: canonDropsOnTurtle,
    },
  },
  veil: { target: ally },
};
