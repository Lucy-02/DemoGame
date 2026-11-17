import { STATUSES } from "../../core/battle/statuses";
import { ELEMENT_NAME } from "../../core/data";
import { termOfIcon } from "../glossary/terms";

// 전투 화면 문구. 받을 피해·앞열·약점·방어도·속성은 필드에서 기호로 그리고, 가리키면 뜨는 한 줄 풀이에만 글로 써요
/** ① (U+2460) */
const CIRCLED_ONE = 0x2460;

export const COPY = {
  turn: "턴",
  myTurn: "내 차례",
  playing: "재생 중",
  maxPrefix: "/",
  endTurn: "턴 종료",
  /** 가운데 고르기 창 (0075). 제목은 명사형, 버튼은 행동 이름 */
  pick: {
    fall: (n: number) => `낙하 ${n}장 고르기`,
    hold: (n: number) => `품을 카드 ${n}장 고르기`,
    showField: "필드 보기",
    confirmHold: "품기",
  },
  // 기호 풀이 (TEXT_RULES 4절 라벨: 명사구). 상태 풀이는 이름 + 수 · 용어 사전의 첫 문장 (0102)
  element: "속성",
  block: "방어도",
  incoming: "받을 피해",
  incomingSub: "이번 적 차례에 받는 피해 합계",
  weak: "약점",
  front: "앞열",
  /** 가운뎃점 (앞뒤 띄움, 문구 규칙) */
  sep: " · ",
  /** 순서표 머리의 장소: 지금 층 (지역 이름이 정해지면 바꿔요) */
  floor: (n: number) => `${n}층`,
  /** 순서표 토큰 풀이의 칩 (0074 9번 · 0067). 순서는 원 숫자, 아군 카드는 그 적 "앞" */
  order: {
    /** 해방 배지 글자 (시안) */
    release: "✦",
    card: "카드", charge: "차징", gap: "허점", breakable: "브레이크 가능",
    n: (n: number) => String.fromCharCode(CIRCLED_ONE + n - 1),
    before: (n: number) => `${String.fromCharCode(CIRCLED_ONE + n - 1)} 앞`,
  },
  /** 특성 칩 풀이 (0096, 이름은 임시: TODO_NAMES 2절). 효과문은 합니다체 (TEXT_RULES 1절) */
  trait: {
    reflect: "되돌리기",
    reflectSub: (pct: number) => `턴마다 처음 받는 피해의 ${pct}%를 공격한 정령에게 되돌립니다.`,
    haste: "가속",
    hasteSub: "다른 적이 더 빨리 행동합니다.",
  },
  /** 방전 띠 풀이 */
  band: {
    title: "방전", chip: (n: number) => `방전 ${n}`,
    sub: (n: number) => `이 구간에서 끝나는 카드의 주인에게 피해를 ${n} 입힙니다.`,
  },
  /** 적 이름 옆 등급 꼬리표 */
  rank: { elite: "정예", boss: "보스" } as Record<string, string | undefined>,
};

/** 속성 기호(el-*) → 이름 */
export const elementName = (icon: string): string | undefined => {
  const id = icon.replace(/^el-/, "");
  return (ELEMENT_NAME as Record<string, string>)[id];
};

/** 상태 기호(kw-*) → 이름 (용어 사전, 없으면 코어 상태 정의). 둘 다 없는 기호는 풀이를 띄우지 않아요 */
export const statusName = (icon: string): string | undefined =>
  termOfIcon(icon)?.name ?? (STATUSES as Record<string, { name: string } | undefined>)[icon.replace(/^kw-/, "")]?.name;
