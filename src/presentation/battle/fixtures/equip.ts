// 예시: 장비를 지닌 아군 (0066 · Q2-A f5). 정본 쉬는 장면에 장비 칸만 얹었어요.
// 장비 값은 규칙 데이터에서 만들어요. 정본 장면의 아군은 임시 정령이라, 말풍선은 그 장비 주인(도롱뇽)의 값으로 채워요.
import { maxHpOf } from "../../../core/stats";
import type { RunEquip, RunSpirit } from "../../../core/types";
import { equipSheet, equipVM } from "../../run/fromCore";
import type { AllyVM, BattleVM } from "../viewmodel";
import { canonRest } from "./canonRest";

const holder = (id: string, stage: RunSpirit["stage"], branch: string | undefined, equipment: RunEquip[]): RunSpirit => {
  const rs: RunSpirit = { id, hp: 0, maxHpBonus: 0, stage, level: 1, personality: "sturdy", branch, equipment };
  return { ...rs, hp: maxHpOf(rs) };
};

const slots = (rs: RunSpirit): AllyVM["equip"] => rs.equipment.map((e) => ({ item: equipVM(e, rs.stage), tip: { sheet: equipSheet(e, rs) } }));

const kept = (id: string, resonance = 1): RunEquip => ({ id, resonance, from: "kept" });

const EQUIP: AllyVM["equip"][] = [
  slots(holder("fire_fox", "baby", undefined, [kept("bone_sword")])),
  slots(holder("glass_salamander", "awakened", "hold", [kept("salamander_gauntlet", 2), kept("moss_hammer")])),
  undefined,
];

export const exampleEquip: BattleVM = {
  ...canonRest,
  allies: canonRest.allies.map((a, i) => ({ ...a, equip: EQUIP[i] })),
  enemies: canonRest.enemies.map((e) => ({ ...e, hovered: false })),
};
