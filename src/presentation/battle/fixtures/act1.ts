// 예시: 1막 적 그림 (0100). 실제 전투 규칙으로 만든 장면이에요. 그림 크기와 발 위치(enemyFit.json)를 맞출 때 봐요.
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
