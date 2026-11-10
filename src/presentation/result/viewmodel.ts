// 전투 결과 화면이 그리는 값 (0044 + 0050 + 0051). 화면은 "카드 목록 + 주인"만 받아요. 보상을 어떻게 뽑는지는 규칙(src/core)의 일이에요.
import type { IconId } from "../faces";
import type { CardVM } from "../card/viewmodel";
import type { Crop } from "../spirits/artFit";

/** 정령 줄에 보이는 능력치 (0044: 카드가 쓰는 능력치가 밝아져요) */
export type StatId = "power" | "guard" | "focus";
export const STAT_IDS: readonly StatId[] = ["power", "guard", "focus"];

export interface RewardCardVM {
  card: CardVM;
  /** 주인 정령 줄 (LaneVM.id). 보상 카드는 주인이 정해져 있어요 (0040) */
  owner: string;
  /** 이 카드가 쓰는 능력치. 집으면 주인 줄에서 밝아져요 */
  stat?: StatId;
}

export interface LaneVM {
  id: string;
  name: string;
  level: number;
  /** 이번 전투로 레벨이 올랐어요 */
  levelUp?: boolean;
  hp: number;
  maxHp: number;
  /** 쓰러졌다가 HP 1로 돌아온 정령 (0044: 회색 얼굴, 끊긴 붉은 점선 링) */
  down?: boolean;
  /** 경험 링: before까지는 지난 경험, before~after가 이번에 더해진 만큼 (0~1) */
  exp: { before: number; after: number };
  /** 얼굴 그림. 없으면 자리표시 */
  face?: { key: string; crop: Crop };
  stats: Record<StatId, number>;
  /** 문턱을 넘었을 때만 붙는 표식 (g-up 레벨 업, g-cardnew 카드 해금, g-seed 키울 수 있음) */
  badges: IconId[];
  /** 새로 열린 카드 이름 */
  unlocked: string[];
}

export interface ResultVM {
  /** 골드는 자동으로 받아요. total은 받은 뒤 값 */
  gold: { total: number; gained: number };
  /** 왼→오 순서 = 정령 줄 위→아래 순서 (0051) */
  cards: RewardCardVM[];
  /** 넘기면 받는 골드. 값이 정해지지 않았으면 비워 둬요 (0049 후속) */
  skipGold?: number;
  lanes: LaneVM[];
}
