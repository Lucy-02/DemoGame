// 상점 화면이 그리는 값 (0046 뼈대 + 0050 격자).
import type { CardVM } from "../card/viewmodel";
import type { LaneVM, StatId } from "../run/viewmodel";

export interface ShopCardVM {
  card: CardVM;
  price: number;
  affordable: boolean;
  /** 배울 수 있는 정령 줄 (LaneVM.id). 하나면 누르는 즉시 그 정령이 배워요 */
  learners: string[];
  /** 이 카드가 쓰는 능력치 */
  stat?: StatId;
}

export interface ServiceVM {
  price: number;
  enabled: boolean;
}

export interface ShopVM {
  gold: number;
  /** 진열 칸. 팔린 칸은 비어 있어요 */
  cards: (ShopCardVM | undefined)[];
  remove: ServiceVM;
  /** gain: 치료하면 줄마다 차는 HP */
  heal: ServiceVM & { gain: Record<string, number> };
  lanes: LaneVM[];
}
