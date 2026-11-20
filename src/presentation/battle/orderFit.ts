// 순서표 판 폭 맞추기 (그리기 없음, 순수 함수). 판은 오른쪽 위 버튼 앞에서 멈춰요 (0160).
// 넘치면 칸 폭을 가장 긴 묶음에 맞추던 것을 풀고(칸마다 제 묶음만큼), 빈 칸에 미리 잡아 둔 카드 자리를 하나씩 줄이고,
// 그래도 넘치면 토큰 사이 선을 줄여요.

export interface OrderFit {
  /** 모든 칸이 가장 긴 묶음과 같은 폭 (0038). 넘치면 풀어요 */
  even: boolean;
  /** 빈 칸에 미리 잡아 둘 카드 자리 수 */
  reserve: number;
  /** 토큰 사이 선 길이 */
  line: number;
}

/** widthOf: 그 자리 수 · 선 길이로 그렸을 때의 판 폭. from에서 시작해 maxW에 들어올 때까지만 줄여요 */
export function fitOrder(maxW: number, widthOf: (fit: OrderFit) => number, from: OrderFit, lineMin: number): OrderFit {
  const fit = { ...from };
  if (widthOf(fit) > maxW) fit.even = false;
  while (widthOf(fit) > maxW && fit.reserve > 0) fit.reserve--;
  while (widthOf(fit) > maxW && fit.line > lineMin) fit.line = Math.max(lineMin, fit.line - 1);
  return fit;
}
