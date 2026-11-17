// 예시: 1~5막 적 그림 (0100 · 0114 · 0115 · 0116 · 0117). 실제 전투 규칙으로 만든 장면이에요. 그림 크기와 발 위치(enemyFit.json)를 맞출 때 봐요.
import { Run } from "../../../core/run";
import { BattleSession } from "../../../session/battle";
import { battleVM } from "../fromBattle";
import type { BattleVM } from "../viewmodel";

const PARTY = ["fire_fox", "mist_cat", "glass_salamander"];

function scene(enemies: string[]): BattleVM {
  const run = new Run({ seed: 7, frontId: PARTY[0], adult: false, unlockAll: false, party: PARTY });
  return battleVM(new BattleSession(run, enemies).battle, "1막");
}

/** ?scene=act1-<이름>: 1막 잡몹 셋씩 · 정예 · 보스 */
export const ACT1: Record<string, () => BattleVM> = {
  "act1-mobs-a": () => scene(["moss_slime", "bramble_rat", "wisp"]),
  "act1-mobs-b": () => scene(["rubble_shell", "tempest_crow", "whirl"]),
  "act1-mobs-c": () => scene(["rust_golem", "wisp", "bramble_rat"]),
  "act1-toad": () => scene(["bog_witch"]),
  "act1-wolf": () => scene(["frost_pup", "frostfang", "frost_pup"]),
  "act1-imp": () => scene(["cinder_imp"]),
  "act1-grimbark": () => scene(["grimbark"]),
  "act1-wildfire": () => scene(["wildfire"]),
  "act1-gale": () => scene(["gale"]),
};

/** ?scene=act2-<이름>: 2막 잡몹 · 정예 · 보스 (0114) */
export const ACT2_ART: Record<string, () => BattleVM> = {
  "act2-mobs-a": () => scene(["rock_pile", "mole", "spark_bug"]),
  "act2-mobs-b": () => scene(["lightning_rod", "firefly_swarm", "mirror_shard"]),
  "act2-mobs-c": () => scene(["wandering_armor", "firefly_swarm"]),
  "act2-turtle": () => scene(["quake_turtle"]),
  "act2-bird": () => scene(["thunder_bird"]),
  "act2-lantern": () => scene(["lantern_keeper"]),
  "act2-landslide": () => scene(["landslide"]),
  "act2-thunderstorm": () => scene(["thunderstorm"]),
  "act2-high-noon": () => scene(["high_noon"]),
};

/** ?scene=act3-<이름> · act4-<이름> · act5-<이름>: 3~5막 적 (0115 · 0116 · 0117) */
export const ACT345_ART: Record<string, () => BattleVM> = {
  "act3-mobs-a": () => scene(["snowball", "ice_rock", "droplet"]),
  "act3-mobs-b": () => scene(["rapids", "shade", "dusk"]),
  "act3-mobs-c": () => scene(["hollow_armor", "small_shade"]),
  "act3-elites": () => scene(["ice_warden", "tidal_serpent", "twin_shade"]),
  "act3-cold-snap": () => scene(["cold_snap"]),
  "act3-flood-tide": () => scene(["flood_tide"]),
  "act3-eclipse": () => scene(["eclipse"]),
  "act4-mobs-a": () => scene(["sand_gust", "pinwheel", "glass_mole"]),
  "act4-mobs-b": () => scene(["halo", "shade_claw", "gloam"]),
  "act4-mobs-c": () => scene(["old_statue", "gloom_twin_a", "gloom_twin_b"]),
  "act4-elites": () => scene(["storm_hawk", "mirror_knight"]),
  "act4-typhoon": () => scene(["typhoon"]),
  "act4-white-night": () => scene(["white_night"]),
  "act4-dark-moon": () => scene(["dark_moon"]),
  "act5-shards": () => scene(["ember_shard", "tide_shard", "stone_shard"]),
  "act5-elites": () => scene(["spark_shard", "gate_keeper", "echo"]),
  "act5-origin": () => scene(["origin"]),
};
