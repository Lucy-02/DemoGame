// 데모 끝 화면 문구 (0101, TEXT_RULES 4절 제목). 버튼은 판 결과의 낱말을 그대로 써요.
import { COPY as RUN_COPY } from "../run/copy";

export const COPY = {
  title: "데모 끝",
  /** 링크 자리: 주소와 낱말은 아직 없어요 (스팀 페이지 · 피드백 창구는 Lucy 결정 대기) */
  slots: [RUN_COPY.wishlistSlot, "[피드백]"],
};
