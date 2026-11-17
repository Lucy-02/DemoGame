// 판 결과 문구 (0046 · 0076 17번 낱말 `승리` · `층`, TEXT_RULES 6절 기록 · 8절 안내 · 3절 버튼).
export const COPY = {
  /** 기록 한 줄: 1막 · 6층 · 승리 */
  act: (n: number) => `${n}막`,
  floor: (n: number) => `${n}층`,
  victory: "승리",
  defeat: "패배",
  /** 첫 판 전멸 안내 (0046 A1). 기호 g-up 옆 명사구 (Lucy 2026-11-17 글 줄이기) */
  keep: (wins: number) => `이긴 전투 ${wins}번 경험 유지`,
  garden: "정원으로",
  again: "다시 떠나기",
};
