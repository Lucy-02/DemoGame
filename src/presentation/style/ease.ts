// CSS cubic-bezier(x1, y1, x2, y2)를 Phaser 트윈 ease 함수로 바꿔요.

export function cubicBezier([x1, y1, x2, y2]: readonly number[]): (t: number) => number {
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  const dBez = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s * s;
  return (t: number) => {
    if (t <= 0 || t >= 1) return t;
    // x(s) = t 를 뉴턴법으로 풀고 y(s)를 돌려줘요
    let s = t;
    for (let i = 0; i < 8; i++) {
      const dx = dBez(x1, x2, s);
      if (Math.abs(dx) < 1e-6) break;
      s -= (bez(x1, x2, s) - t) / dx;
      s = Math.min(1, Math.max(0, s));
    }
    return bez(y1, y2, s);
  };
}

/** "160ms" → 160 */
export const ms = (d: string) => parseFloat(d);
