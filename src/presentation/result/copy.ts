// 전투 결과 화면 문구. 늘 보이는 글은 이름·숫자·버튼 동사만 (0050).
export const COPY = {
  skip: "넘기기",
  lv: (n: number) => `Lv ${n}`,
  /** 정해지지 않은 숫자 자리 */
  unknown: "?",
  sep: " · ",
};

/** 능력치 기호 (0050 임시: 정본 기호 가운데 뜻이 가까운 것) */
export const STAT_ICON = { power: "fx-damage", guard: "fx-block", focus: "i-spark" } as const;

/** 재질 이름 (카드 말풍선 주인 줄: 정령 · 속성 · 재질, 정본 battle-r5) */
export const MATERIAL_NAME = { fire: "용암석", water: "유약", wind: "TODO_NAME", none: "무지" } as const;
