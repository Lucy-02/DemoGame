// 타이틀 겸 메인 화면이 그리는 값. 규칙 타입(core)은 넣지 않아요.
import type { Crop } from "../spirits/artFit";

export type HomeItemId = "spirits" | "codex" | "settings" | "quit";

/** 줄 끝 표시: 숫자 = 눌러서 할 행동의 개수, new = 처음 본 것. 둘 다면 숫자만 (0054) */
export type HomeBadge = { kind: "count"; n: number } | { kind: "new" };

export interface HomeItemVM {
  id: HomeItemId;
  label: string;
  /** 정본 기호 id. 없으면 점선 칸 (TODO_ICON) */
  icon?: string;
  badge?: HomeBadge;
  /** 올렸을 때 말풍선: 머리 + 줄들 */
  tip?: { title: string; lines: string[] };
}

/** 오른쪽 아래 강조 버튼: 새 판을 떠나거나, 진행 중인 판을 이어요 */
export type HomePrimaryVM =
  | { kind: "depart"; label: string }
  | { kind: "continue"; label: string; floor: string; faces: ({ key: string; crop: Crop } | undefined)[]; ids: string[] };

export interface HomeVM {
  title: string;
  primary: HomePrimaryVM;
  items: HomeItemVM[];
}
