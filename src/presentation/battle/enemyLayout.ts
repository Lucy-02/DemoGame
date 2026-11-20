// 적 자리 잡기 (0158): 도감의 크기 등급대로 세워요. 자리는 몸 폭만큼, 의도 알약은 머리 위, 그림자와 체력 막대 폭도 몸에 맞춰요.
// 크기 값은 enemyFit.json(size · h · w · float), 등급 표와 가로 범위는 layout.ts의 ENEMY.
import fitJson from "./enemyFit.json";
import { ENEMY, GROUND, INFO, INTENT } from "./layout";

type Size = keyof typeof ENEMY.sizes;
interface Fit { size?: Size; h?: number; w?: number; float?: boolean; of?: string }
const FITS = fitJson as unknown as Record<string, Fit>;

export interface EnemySpot {
  /** 가운데 x */
  x: number;
  /** 의도 알약의 위 끝 */
  top: number;
  /** 그림 크기 */
  w: number; h: number;
  /** 체력 막대 폭 */
  bar: number;
  /** 이 적이 차지하는 가로 폭 */
  slot: number;
  shadow: { w: number; h: number; alpha: number };
}

function measure(art: string) {
  const fit = FITS[FITS[art]?.of ?? art];
  // 그림이 없는 적은 예전 자리표시 크기
  if (!fit?.h || !fit.w) return { w: ENEMY.art.w, h: ENEMY.art.h, bar: INFO.w, float: false };
  return { w: fit.w, h: fit.h, bar: ENEMY.sizes[fit.size ?? "M"].bar, float: !!fit.float };
}

/** 이 조우가 차지하는 가로 폭 (자리 폭의 합 + 사이) */
export function enemiesWidth(arts: readonly string[]) {
  const F = ENEMY.field;
  return arts.reduce((sum, art) => { const m = measure(art); return sum + Math.max(m.w, m.bar + F.slotPad); }, 0) + F.gap * Math.max(0, arts.length - 1);
}

/** 적들의 자리. buried = 땅속이라 윗부분만 보이는 적 (알약이 보이는 몸 위로 내려와요) */
export function enemySpots(arts: readonly string[], buried: readonly boolean[] = []): EnemySpot[] {
  const F = ENEMY.field, S = ENEMY.shadow;
  const total = enemiesWidth(arts);
  let x = Math.max(F.left, Math.min(F.center - total / 2, F.right - total));
  return arts.map((art, i) => {
    const m = measure(art);
    const slot = Math.max(m.w, m.bar + F.slotPad);
    const shown = m.h * (buried[i] ? ENEMY.buried : 1);
    const sw = Math.max(S.min, m.w * (m.float ? S.float : S.ratio));
    const spot: EnemySpot = {
      x: Math.round(x + slot / 2), top: Math.round(Math.min(ENEMY.top, ENEMY.feet - shown - ENEMY.intentGap - INTENT.h)),
      w: m.w, h: m.h, bar: m.bar, slot,
      shadow: { w: Math.round(sw), h: Math.round(GROUND.h * Math.max(S.thick[0], Math.min(S.thick[1], sw / GROUND.w))), alpha: m.float ? S.floatAlpha : 1 },
    };
    x += slot + F.gap;
    return spot;
  });
}
