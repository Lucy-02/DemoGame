import { STATUSES } from "../../core/battle/statuses";
import { ELEMENT_NAME } from "../../core/data";

// 전투 화면 문구. 받을 피해·앞열·약점·방어도·속성은 필드에서 기호로 그리고, 가리키면 뜨는 한 줄 풀이에만 글로 써요
export const COPY = {
  turn: "턴",
  myTurn: "내 차례",
  maxPrefix: "/",
  endTurn: "턴 종료",
  // 기호 풀이 (TEXT_RULES 4절 라벨: 명사구). 상태 풀이는 이름 + 수만: 효과 문장은 정본 문구가 생기면 붙여요
  element: "속성",
  block: "방어도",
  incoming: "받을 피해",
  incomingSub: "이번 적 차례에 받는 피해 합계",
  weak: "약점",
  front: "앞열",
};

/** 코어 데이터에 아직 없는 속성 이름 (0028 상성 고리의 이름 그대로) */
const ELEMENT_NAME_LATER: Record<string, string> = { electric: "전기", ice: "얼음", shadow: "그림자" };

/** 속성 기호(el-*) → 이름 */
export const elementName = (icon: string): string | undefined => {
  const id = icon.replace(/^el-/, "");
  return (ELEMENT_NAME as Record<string, string>)[id] ?? ELEMENT_NAME_LATER[id];
};

/** 상태 기호(kw-*) → 이름 (코어 상태 정의). 정의가 없는 기호는 풀이를 띄우지 않아요 */
export const statusName = (icon: string): string | undefined =>
  (STATUSES as Record<string, { name: string } | undefined>)[icon.replace(/^kw-/, "")]?.name;
