// 출전 준비 고정 장면 (?screen=depart&scene=three|two)
import { newGarden, type Garden } from "../../core/garden";
import { departVM } from "./fromGarden";
import type { DepartVM } from "./viewmodel";

/** 정령 셋 (라운드 H f7): 유리 도롱뇽 신중(열린 성격 셋) · 산양 용맹(지난 앞열, 열린 성격 하나) · 카멜레온 장난(열린 것 없음) */
function garden(ids: string[]): Garden {
  const g = newGarden(7, ids);
  const set: Record<string, { personality: string; cleared?: string[] }> = {
    glass_salamander: { personality: "careful", cleared: ["stubborn", "sturdy", "cheerful"] },
    magma_ibex: { personality: "brave", cleared: ["brave", "clever"] },
    prism_chameleon: { personality: "playful" },
  };
  return { ...g, front: "magma_ibex", spirits: g.spirits.map((s) => ({ ...s, ...set[s.id] })) };
}

export const DEPARTS: Record<string, DepartVM> = {
  three: departVM(garden(["glass_salamander", "magma_ibex", "prism_chameleon"]), { strongElement: "forest", front: "magma_ibex" }),
  two: departVM(garden(["glass_salamander", "magma_ibex"]), { strongElement: "forest", front: "magma_ibex" }),
};
export const DEFAULT_DEPART = "three";
