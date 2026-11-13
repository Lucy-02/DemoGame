// 타이틀 겸 메인 화면 문구. 버튼은 명사구·~기 (문구 규칙 3절). 이름은 모두 임시예요.
export const COPY = {
  /** 게임 이름은 아직 없어요 (브랜딩 결정 대기) */
  title: "[게임 이름]",
  depart: "탐험 떠나기",
  continue: "이어하기",
  /** 정령 관리 진입점. 낱말은 Lucy 확인 대기 (0054) */
  spirits: "정령 보기",
  codex: "도감",
  settings: "설정",
  quit: "종료",
  new: "N",
  floor: (n: number) => `${n}층`,
  grow: (n: number) => `키우기 ${n}`,
  branch: (n: number) => `갈래 고르기 ${n}`,
  newSpirit: (n: number) => `새 정령 ${n}`,
  newCard: (n: number) => `새 카드 ${n}`,
  /** 두 사실을 한 줄에 (문구 규칙: 가운뎃점 앞뒤 띄움) */
  join: (parts: string[]) => parts.join(" · "),
};
