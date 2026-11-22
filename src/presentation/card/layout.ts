// 카드 두 얼굴의 배치 (0161, 카드 라운드 K2 L1 시안 https://claude.ai/artifact/9UzXGeVYwJi6JkwwwsS55B). 값은 시안에서 옮긴 임시 값이에요.
// 좌표는 카드 바깥 상자 왼쪽 위 기준.

/** 작은 얼굴 (손패 · 덱 보기): 그림이 카드 전체, 아래 어두운 띠에 수치 + 이름. 5:7 */
export const HAND_CARD = {
  w: 90, h: 126, radius: 7, border: 1,
  /** 그림: 정사각 원본을 이 크기로, 가로 가운데 · 아래 맞춤 */
  art: { size: 144, top: -18, placeholder: 30 },
  /** 아래 띠: 위쪽 fade 만큼은 투명에서 짙어져요. 수치가 없으면 이름 한 줄 높이 */
  band: { h: 52, hName: 33, fade: 12, padBottom: 5, gap: 3, nameLh: 1.15 },
  /** 비용 동전 (왼쪽 위). 마력 부족이면 붉은 테 */
  cost: { x: 4, y: 4, d: 24, ring: 1, shortRing: 1.5 },
  /** 수치 줄: 기호 12 + 숫자, 값 사이 7. 강화 화살 10 */
  value: { icon: 12, gap: 2, between: 7, up: 10 },
  /** 표지 (조건 미달 자물쇠 · 무작위 등): 오른쪽 위에서 아래로 */
  mark: { right: 4, y: 4, h: 18, padX: 3, lockPadX: 5, gap: 2, between: 3, icon: 12, ring: 1 },
  liftShadow: { y: 10, blur: 24 },
  /** 집은 카드 바깥 테 */
  held: { width: 2, offset: 2 },
  nameLetterSpacing: -0.02,
};

/** 큰 얼굴 (가리킬 때 · 보상 · 상점): 위는 그림, 아래로 갈수록 어두워져 판 없이 이름 줄 · 효과문 · 기호 줄이 얹혀요 (0161 후속 C2) */
export const BIG_CARD = {
  w: 172, h: 248, radius: 10, border: 1,
  /** 그림: 정사각 원본을 이 크기로, 가로 가운데. 주제가 글 위에 보이게 위로 올려요 */
  art: { size: 232, top: -40, placeholder: 48 },
  /** 어두워지는 띠: 글 자리 위 64에서 시작해 글 자리에 닿기 전에 꽉 찬 어둠이 돼요. [자리 0~1, 불투명도] */
  fade: { above: 64, stops: [[0, 0], [0.16, 0.4], [0.33, 0.9], [0.42, 1], [1, 1]] as const },
  cost: HAND_CARD.cost,
  /** 글 자리 (판은 그리지 않아요): 카드 안쪽 4, 높이 고정 (효과문 네 줄 자리. 넘치면 위로 자라요) */
  plate: { inset: 4, pad: [6, 8, 6, 8] as [number, number, number, number], headH: 20, headGap: 3, lines: 4, lineH: 16, footGap: 5, footH: 18 },
  /** 이름 줄 끝 수치 (전투에서만) */
  value: { icon: 12, gap: 2, between: 5 },
  /** 기호 줄: 주인 얼굴 · 속성 · 희귀도 · 강화 */
  foot: { size: 18, gap: 8, role: 12 },
  termOffset: 3,
  /** 못 내는 사유 표지: 윗선 가운데에 걸쳐요 */
  why: { h: 22, padX: 9, radius: 11, gap: 4, icon: 13, ring: 1 },
  shadow: { y: 14, blur: 34 },
  /** 손패에서 가리킬 때 펼치는 배율 · 화면 아래 끝에서 띄우는 만큼 */
  peek: { scale: 1.2, bottom: 6, noteGap: 10, enterY: 6 },
};

const P = BIG_CARD.plate;
/** 글 자리 높이 */
export const BIG_PLATE_H = P.pad[0] + P.headH + P.headGap + P.lines * P.lineH + P.footGap + P.footH + P.pad[2];
