// 깃들기 화면 문구 (TEXT_RULES: 버튼은 동사, 상태는 기호)
export const COPY = {
  pick: "고르기",
  /** 고른 뒤 버튼: 정령 이름 + 동사 */
  pickName: (name: string) => `${name} 고르기`,
  next: "계속",
  /** 성격 풀이 아래 줄: 효과문(합니다체)과 한 상자라 명사형 */
  personalityFrom: "성체부터",
};
