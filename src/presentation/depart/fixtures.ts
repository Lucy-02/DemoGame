// 출전 준비 고정 장면 (?screen=depart&scene=three|two)
import { newGarden, type Garden } from "../../core/garden";
import { GROWTH } from "../../core/data";
import { departVM } from "./fromGarden";
import type { DepartVM } from "./viewmodel";

/** 정령 셋: 유리 도롱뇽 Lv 3(장비, 새 카드) · 산양 Lv 2(지난 앞열) · 카멜레온 Lv 1 */
function garden(ids: string[]): Garden {
  const g = newGarden(7, ids);
  const at = (lv: number) => GROWTH.levels[lv - 1];
  return {
    ...g, front: "magma_ibex",
    spirits: g.spirits.map((s) => s.id === "glass_salamander"
      ? { ...s, exp: at(3), seen: ["glass_salamander_lv3"], equipment: [{ id: "salamander_gauntlet", resonance: 1 }] }
      : s.id === "magma_ibex" ? { ...s, exp: at(2) } : s),
  };
}

export const DEPARTS: Record<string, DepartVM> = {
  three: departVM(garden(["glass_salamander", "magma_ibex", "prism_chameleon"]), { strongElement: "forest", front: "magma_ibex" }),
  two: departVM(garden(["glass_salamander", "magma_ibex"]), { strongElement: "forest", front: "magma_ibex" }),
};
export const DEFAULT_DEPART = "three";
