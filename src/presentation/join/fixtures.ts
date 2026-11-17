// 깃들기 고정 장면 (?screen=join&scene=first|second|beat&hover=<후보 id>)
import { joinCandVM, faceOf } from "./fromGarden";
import type { JoinVM } from "./viewmodel";

export const JOINS: Record<string, JoinVM> = {
  /** 첫 판 뒤: 가진 정령 유리 도롱뇽, 후보 불여우(그림 없음) · 산양 */
  first: {
    cands: [joinCandVM("fire_fox", "playful"), joinCandVM("magma_ibex", "brave")],
    party: [faceOf("glass_salamander")], seats: 3,
  },
  /** 첫 보스까지 끝낸 판: 산양을 고른 바로 뒤 둘째 깃들기 */
  second: {
    cands: [joinCandVM("fire_fox", "careful"), joinCandVM("prism_chameleon", "clever")],
    party: [faceOf("glass_salamander"), faceOf("magma_ibex")], seats: 3, prev: faceOf("magma_ibex"),
  },
};
export const DEFAULT_JOIN = "first";
