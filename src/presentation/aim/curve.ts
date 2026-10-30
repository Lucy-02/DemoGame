// 조준선 모양 계산 (그리기 없음, 순수 함수).
// 정본 조준선 한 개를 "시작→끝 현(chord) 기준" 모양으로 바꿔 두고, 다른 시작·끝에도 같은 모양을 돌리고 늘려서 써요.
// 여러 대상이면 시작점 하나에서 대상마다 한 줄씩, 대상 쪽으로 부풀어 부채처럼 퍼져요.

export interface Pt {
  x: number;
  y: number;
}

/** 3차 베지어 (SVG "M p0 C c1, c2, p3") */
export interface Cubic {
  p0: Pt;
  c1: Pt;
  c2: Pt;
  p3: Pt;
}

/** 현 기준 조절점: along = 현 방향 비율, side = 현의 오른쪽 법선 방향 비율 (현 길이 = 1) */
export interface CurveShape {
  c1: { along: number; side: number };
  c2: { along: number; side: number };
  /** 원본이 오른쪽(+1)으로 가는 선이었는지 왼쪽(-1)이었는지. 반대쪽 대상은 거울로 뒤집어요. */
  dir: 1 | -1;
}

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });

/** 화면 좌표(y 아래로)에서 진행 방향 u의 오른쪽 법선 */
const normal = (u: Pt): Pt => ({ x: -u.y, y: u.x });

function frame(p0: Pt, p3: Pt) {
  const v = sub(p3, p0);
  const len = Math.hypot(v.x, v.y);
  const u = len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: -1 };
  return { len, u, n: normal(u) };
}

/** 예시 곡선에서 모양을 뽑아요. */
export function shapeOf(c: Cubic): CurveShape {
  const { len, u, n } = frame(c.p0, c.p3);
  const local = (p: Pt) => {
    const d = sub(p, c.p0);
    return { along: (d.x * u.x + d.y * u.y) / len, side: (d.x * n.x + d.y * n.y) / len };
  };
  return { c1: local(c.c1), c2: local(c.c2), dir: c.p3.x >= c.p0.x ? 1 : -1 };
}

/** 시작점에서 대상까지 같은 모양의 곡선. 대상이 원본과 반대쪽(가로)에 있으면 거울로 뒤집어 대상 쪽으로 부풀게 해요. */
export function curveTo(p0: Pt, p3: Pt, shape: CurveShape): Cubic {
  const { len, u, n } = frame(p0, p3);
  const dir = p3.x === p0.x ? shape.dir : p3.x > p0.x ? 1 : -1;
  const flip = dir === shape.dir ? 1 : -1;
  const at = (l: { along: number; side: number }): Pt => ({
    x: p0.x + (u.x * l.along + n.x * l.side * flip) * len,
    y: p0.y + (u.y * l.along + n.y * l.side * flip) * len,
  });
  return { p0, c1: at(shape.c1), c2: at(shape.c2), p3 };
}

/** 시작점·대상 → 곡선. 모양 규칙은 갈아 끼울 수 있어요 (Lucy 확정 전 후보). 둘 다 정본 예시 한 개는 그대로 재현해요. */
export type CurveRule = (p0: Pt, p3: Pt) => Cubic;

export const CURVE_RULES = {
  /** 거울: 정본 모양을 현에 맞춰 돌리고 늘려요. 반대쪽 대상은 거울로 뒤집어 바깥으로 부풀어요. */
  mirror: (example: Cubic): CurveRule => {
    const shape = shapeOf(example);
    return (p0, p3) => curveTo(p0, p3, shape);
  },
  /** 줄기: 떠나는 방향(c1 - p0)과 들어가는 방향(c2 - p3)을 정본 그대로 고정해요.
   *  모든 줄이 시작점에서 한 다발로 나가 위에서 갈라져요. */
  trunk: (example: Cubic): CurveRule => {
    const out = sub(example.c1, example.p0), into = sub(example.c2, example.p3);
    return (p0, p3) => ({ p0, c1: { x: p0.x + out.x, y: p0.y + out.y }, c2: { x: p3.x + into.x, y: p3.y + into.y }, p3 });
  },
};

export type CurveRuleName = keyof typeof CURVE_RULES;

/** 곡선 위 점 (t = 0~1) */
export function pointAt(c: Cubic, t: number): Pt {
  const m = 1 - t;
  const a = m * m * m, b = 3 * m * m * t, d = 3 * m * t * t, e = t * t * t;
  return {
    x: a * c.p0.x + b * c.c1.x + d * c.c2.x + e * c.p3.x,
    y: a * c.p0.y + b * c.c1.y + d * c.c2.y + e * c.p3.y,
  };
}
