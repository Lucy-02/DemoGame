// 런 화면 공용 문구. 늘 보이는 글은 이름·숫자·버튼 동사만 (0050).
export const COPY = {
  lv: (n: number) => `Lv ${n}`,
  /** 정해지지 않은 숫자 자리 */
  unknown: "?",
  sep: " · ",
  /** a→b (골드, 덱 장수) */
  arrow: "→",
  /** 능력치 증감 칩 (TEXT_RULES 숫자·기호: 부호는 수에 붙여요) */
  delta: (n: number) => (n > 0 ? `+${n}` : String(n)),
  /** 주인이 정해지지 않은 카드의 말풍선 주인 줄 (P1 f3) */
  shared: "공용",
  /** 내려놓는 장비의 꼬리표 (TEXT_RULES 5절 명사형) */
  dropped: "사라짐",
  /** 안내 (TEXT_RULES 8절 해요체) */
  noBranch: "갈래를 고르면 대표 카드가 기술로 바뀌어요",
};

/** 능력치 기호 (0050 임시: 정본 기호 가운데 뜻이 가까운 것) */
export const STAT_ICON = { power: "fx-damage", guard: "fx-block", focus: "i-spark" } as const;

/** 재질 이름 (카드 말풍선 주인 줄: 정령 · 속성 · 재질, 정본 battle-r5) */
/** 바람 재질은 이름이 아직 없어서(TODO_NAME) 비워 둬요: 주인 줄에서 빠져요 */
export const MATERIAL_NAME: Record<string, string | undefined> = { fire: "용암석", water: "유약", none: "무지" };
