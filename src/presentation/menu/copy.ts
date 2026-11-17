// 판 안 메뉴 · 설정 문구 (0084). 버튼은 명사구(3절), 확인 창 제목은 `~할까요?`(9절), 버튼에 다는 호버 설명은 해요체(2절 끝 · 8절).
export const COPY = {
  resume: "계속",
  settings: "설정",
  toHome: "메인으로",
  giveUp: "탐험 포기",
  close: "닫기",
  giveUpTitle: "탐험을 포기할까요?",
  tip: {
    toHome: "지금 칸에 들어온 때로 저장돼 있어요. 이어 하면 이 칸의 처음부터예요.",
    giveUp: "탐험이 패배로 끝나요. 이긴 전투의 경험과 지닌 장비는 남아요.",
    speed: "턴 종료 뒤 재생만 빨라져요.",
    shake: "끄면 화면이 흔들리거나 번쩍이지 않아요.",
  },
  volume: { master: "전체 음량", music: "음악", sfx: "효과음" },
  fullscreen: "전체화면",
  speed: "재생 속도",
  speeds: { normal: "보통", fast: "빠르게" },
  shake: "화면 흔들림",
  percent: (v: number) => String(Math.round(v * 100)),
};
