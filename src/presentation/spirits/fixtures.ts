// 고정 정령들 (?screen=spirits&scene=…). 화면 확인·시각 검증에 써요.
// 성장은 판 안에서 끝나서(0157), 자란 모습은 "판 안의 어느 때"를 고정해 둔 값이에요.
import { GROWTH } from "../../core/data";
import { newGarden } from "../../core/garden";
import { levelOf } from "../../core/growth";
import { maxHpOf } from "../../core/stats";
import type { RunSpirit } from "../../core/types";
import { gardenRoster, type Roster } from "./roster";

const SEED = 7;

function shape(over: Record<string, Partial<RunSpirit>>, received: Record<string, string[]> = {}): Roster {
  const base = gardenRoster(newGarden(SEED));
  const spirits = base.spirits.map((s) => {
    const rs = { ...s, ...over[s.id] };
    rs.level = levelOf(rs.exp);
    return { ...rs, hp: maxHpOf(rs) };
  });
  return { spirits, received };
}

const L = GROWTH.levels;

export const ROSTERS: Record<string, Roster> = {
  /** 떠날 때: 셋 다 유체 Lv1 */
  fresh: shape({}),
  /** 세 단계가 다 보이는 판: 불여우 성체 키우기 가능(갈래 둘 다 열림), 도롱뇽 성체, 고양이 각성체 */
  mixed: shape({
    fire_fox: { exp: L[3] + 10 },
    glass_salamander: { exp: L[4] + 40, stage: "adult", branch: "hold", deed: 60 },
    mist_cat: { exp: L[5] + 20, stage: "awakened", branch: "freeze" },
  }, { fire_fox: ["kindling", "foxfire", "backfire", "sparks", "flame_pass", "fire_storm"] }),
  /** 지닌 장비 (0066): 불여우 빈 칸, 도롱뇽 전용 무기, 고양이 두 칸(전용 무기 공명 2 · 전설) */
  equip: shape({
    fire_fox: { exp: L[2] },
    glass_salamander: { exp: L[4] + 40, stage: "adult", branch: "hold", equipment: [{ id: "salamander_gauntlet", resonance: 1 }] },
    mist_cat: { exp: L[5] + 20, stage: "awakened", branch: "freeze", equipment: [{ id: "cat_fan", resonance: 2 }, { id: "moss_hammer", resonance: 1 }] },
  }),
  /** 갈래 고르기 (0047 S15): 도롱뇽 Lv4 · 갈래 1만 열림, 갈래 2는 두 장 */
  branch: shape({
    fire_fox: { exp: L[1] },
    glass_salamander: { exp: L[3] + 10 },
    mist_cat: { exp: L[2] },
  }, { glass_salamander: ["heated_glass", "afterglow", "tempered_glass", "glass_shatter", "ricochet"] }),
  /** 갈래 고르기: 둘 다 열림 */
  branchOpen: shape({
    glass_salamander: { exp: L[3] + 10 },
  }, { glass_salamander: ["heated_glass", "afterglow", "tempered_glass", "glass_shatter", "ricochet", "bellows"] }),
  /** 갈래 고르기: 둘 다 잠김 (Lv4는 됨) */
  branchLocked: shape({
    glass_salamander: { exp: L[3] + 10 },
  }),
};

export const DEFAULT_ROSTER = "mixed";
