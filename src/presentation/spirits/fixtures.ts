// 고정 정원 상태 (?screen=spirits&scene=…). 저장이 연결되기 전까지 화면 확인·시각 검증에 써요.
import { GROWTH } from "../../core/data";
import { newGarden, type Garden, type GardenSpirit } from "../../core/garden";

const SEED = 7;

function shape(over: Record<string, Partial<GardenSpirit>>, material: number): Garden {
  const g = newGarden(SEED);
  return { ...g, material, spirits: g.spirits.map((s) => ({ ...s, ...over[s.id] })) };
}

const L = GROWTH.levels;

export const GARDENS: Record<string, Garden> = {
  /** 처음 정원: 셋 다 유체 Lv1 */
  fresh: newGarden(SEED),
  /** 세 단계가 다 보이는 정원: 불여우 성체 키우기 가능 + 새 카드, 도롱뇽 성체(이야기 열림), 고양이 각성체 */
  mixed: shape({
    fire_fox: { exp: L[3] + 10, seen: ["fire_fox_lv2"], affinity: 20 },
    glass_salamander: {
      exp: L[4] + 40, stage: "adult", seen: ["glass_salamander_lv2", "glass_salamander_lv3"], affinity: 90, episodes: 1, deed: 60,
    },
    mist_cat: {
      exp: L[5] + 20, stage: "awakened", seen: ["mist_cat_lv2", "mist_cat_lv3", "mist_cat_adult"], affinity: 160, episodes: 3,
    },
  }, 12),
};

export const DEFAULT_GARDEN = "mixed";
