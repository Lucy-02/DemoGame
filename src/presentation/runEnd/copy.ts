// 판 결과 문구 (0046 · 0076 17번 낱말 `승리` · `층`, TEXT_RULES 6절 기록 · 8절 안내 · 3절 버튼).
export const COPY = {
  /** 기록 한 줄: 1막 · 8층 · 승리 */
  act: (n: number) => `${n}막`,
  floor: (n: number) => `${n}층`,
  victory: "승리",
  defeat: (party: number) => (party > 1 ? `패배: ${["두", "세"][party - 2] ?? party} 정령 모두 쓰러짐` : "패배: 정령 쓰러짐"),
  /** 첫 판 전멸 안내 (0046 A1) */
  keep: (wins: number) => `이긴 전투 ${wins}번만큼 경험이 남았어요`,
  garden: "정원으로",
  again: "다시 떠나기",
};
