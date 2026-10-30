// 조준선 모양 계산 (그리기 없음, 순수 함수).
// 줄기(trunk): 정본 조준선 한 줄의 떠나는 방향(c1 - p0)과 들어가는 방향(c2 - p3)을 그대로 써요.
// 대상을 여럿 고르면 줄기 하나가 정보판 줄 위까지 올라온 뒤 거기서 대상마다 갈라져요 (Lucy 판정 1 ①, 2026-10-30).

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

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** 시작점·대상 → 곡선 */
export type CurveRule = (p0: Pt, p3: Pt) => Cubic;

/** 정본 예시의 떠나는 방향과 들어가는 방향을 고정한 곡선. 정본 예시 한 개는 그대로 재현해요. */
export function trunkRule(example: Cubic): CurveRule {
  const out = sub(example.c1, example.p0), into = sub(example.c2, example.p3);
  return (p0, p3) => ({ p0, c1: add(p0, out), c2: add(p3, into), p3 });
}

/** 곡선 위 점 (t = 0~1) */
export function pointAt(c: Cubic, t: number): Pt {
  const m = 1 - t;
  const a = m * m * m, b = 3 * m * m * t, d = 3 * m * t * t, e = t * t * t;
  return {
    x: a * c.p0.x + b * c.c1.x + d * c.c2.x + e * c.p3.x,
    y: a * c.p0.y + b * c.c1.y + d * c.c2.y + e * c.p3.y,
  };
}

/** 곡선 길이 (꺾은선 근사) */
export function lengthOf(c: Cubic, steps = 64): number {
  let len = 0, prev = c.p0;
  for (let i = 1; i <= steps; i++) {
    const p = pointAt(c, i / steps);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

/** t에서 두 곡선으로 나눠요 (de Casteljau). 앞 곡선 + 뒤 곡선 = 원래 곡선 */
export function splitAt(c: Cubic, t: number): [Cubic, Cubic] {
  const a = lerp(c.p0, c.c1, t), b = lerp(c.c1, c.c2, t), d = lerp(c.c2, c.p3, t);
  const ab = lerp(a, b, t), bd = lerp(b, d, t), m = lerp(ab, bd, t);
  return [{ p0: c.p0, c1: a, c2: ab, p3: m }, { p0: m, c1: bd, c2: d, p3: c.p3 }];
}

/** 끝에서 거슬러 올라가며 처음으로 y 줄을 지나는 t. 끝이 이미 y보다 아래면(화면 기준) 없음 */
export function lastCrossing(c: Cubic, y: number, steps = 64): number | undefined {
  const above = (t: number) => pointAt(c, t).y <= y;
  if (!above(1)) return undefined;
  let hi = 1;
  for (let i = steps - 1; i >= 0; i--) {
    const lo = i / steps;
    if (!above(lo)) {
      let a = lo, b = hi;
      for (let k = 0; k < 30; k++) {
        const m = (a + b) / 2;
        if (above(m)) b = m;
        else a = m;
      }
      return b;
    }
    hi = lo;
  }
  return undefined;
}

/** 줄기 길: via(가장 오른쪽 적 자리) 쪽 곡선을 branchY에서 끊어 공용 줄기로 쓰고, 거기서 대상마다 갈라져요. */
export interface Route {
  via: Pt;
  branchY: number;
}

/** 그릴 곡선 하나와 점선 무늬를 어디서부터 이어 갈지 (앞 조각 길이) */
export interface Stroke {
  curve: Cubic;
  dashOffset: number;
}

/** 시작점 하나에서 대상들까지 그릴 곡선 조각들. via 대상은 줄기 곡선 그대로라 정본 한 줄을 재현해요.
 *  갈래는 갈림점에서 줄기 진행 방향으로 나가 정본과 같은 방향으로 대상에 들어가고, 점선 무늬는 줄기에서 이어져요. */
export function routeCurves(rule: CurveRule, origin: Pt, targets: Pt[], route?: Route): Stroke[] {
  const direct = () => targets.map((p) => ({ curve: rule(origin, p), dashOffset: 0 }));
  if (!route || targets.length === 0) return direct();
  const trunk = rule(origin, route.via);
  const t = lastCrossing(trunk, route.branchY);
  if (t === undefined) return direct();
  const [stem, rest] = splitAt(trunk, t);
  const b = stem.p3;
  const out = sub(rest.c1, rest.p0);
  const outLen = Math.hypot(out.x, out.y) || 1;
  const into = sub(trunk.c2, trunk.p3);
  const branches = targets.map((p) => {
    if (p.x === route.via.x && p.y === route.via.y) return rest;
    const reach = Math.hypot(p.x - b.x, p.y - b.y) / 3;
    return { p0: b, c1: add(b, { x: (out.x / outLen) * reach, y: (out.y / outLen) * reach }), c2: add(p, into), p3: p };
  });
  const offset = lengthOf(stem);
  return [{ curve: stem, dashOffset: 0 }, ...branches.map((curve) => ({ curve, dashOffset: offset }))];
}

/** 왼쪽 길 (Lucy 비교용 후보 가, 확정 전): 판 사이 빈틈(lane)까지 정본 방향을 좌우로 뒤집어 나가 곧게 올라오고,
 *  거기서 대상마다 왼쪽에서 들어가요. lane = 빈틈 가운데 x, 갈림 높이 y */
export function laneCurves(example: Cubic, origin: Pt, targets: Pt[], lane: Pt): Stroke[] {
  if (targets.length === 0) return [];
  const out = { x: -(example.c1.x - example.p0.x), y: example.c1.y - example.p0.y };
  const into = { x: -(example.c2.x - example.p3.x), y: example.c2.y - example.p3.y };
  // 빈틈엔 세로로 들어와요: 조절점을 갈림점 아래로 오른 높이의 절반만큼
  const stem: Cubic = { p0: origin, c1: add(origin, out), c2: { x: lane.x, y: lane.y + (origin.y - lane.y) / 2 }, p3: lane };
  const offset = lengthOf(stem);
  const branches = targets.map((p) => {
    const reach = Math.hypot(p.x - lane.x, p.y - lane.y) / 3;
    return { curve: { p0: lane, c1: { x: lane.x, y: lane.y - reach }, c2: add(p, into), p3: p }, dashOffset: offset };
  });
  return [{ curve: stem, dashOffset: 0 }, ...branches];
}
