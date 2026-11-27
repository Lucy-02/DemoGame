// 판 결과 문구 (0046 · 0076 17번 낱말 `승리` · `층`, TEXT_RULES 6절 기록 · 8절 안내 · 3절 버튼).
export const COPY = {
  /** 기록 한 줄: 1막 · 6층 · 승리 */
  act: (n: number) => `${n}막`,
  floor: (n: number) => `${n}층`,
  victory: "승리",
  defeat: "패배",
  /** 완주로 열린 성격 칩 (0171, 명사형) */
  opened: (name: string) => `${name} 열림`,
  garden: "정원으로",
  again: "다시 떠나기",
};
