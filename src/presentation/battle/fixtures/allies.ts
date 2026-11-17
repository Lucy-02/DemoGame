// 예시: 아군 정령 그림 (0109). 실제 전투 규칙으로 만든 장면에 성장 단계만 바꿔 끼워요. 발 위치를 볼 때 써요.
import { Run } from "../../../core/run";
import type { Stage } from "../../../core/types";
import { BattleSession } from "../../../session/battle";
import { battleVM } from "../fromBattle";
import type { BattleVM } from "../viewmodel";

const PARTIES: Record<string, string[]> = {
  a: ["magma_ibex", "mist_cat", "glass_salamander"],
  b: ["prism_chameleon", "pearl_oyster", "fire_fox"],
};

function scene(party: string[], stage: Stage): BattleVM {
  const run = new Run({ seed: 7, frontId: party[0], adult: false, unlockAll: true, party });
  const vm = battleVM(new BattleSession(run, ["moss_slime", "bramble_rat"]).battle, "1막");
  return { ...vm, allies: vm.allies.map((a) => ({ ...a, stage })) };
}

/** ?scene=ally-<묶음>-<단계>: 정령 셋씩 유체 · 성체 · 각성체 (불여우는 그림이 없어 빈 상자) */
export const ALLIES: Record<string, () => BattleVM> = Object.fromEntries(
  Object.entries(PARTIES).flatMap(([k, party]) => (["baby", "adult", "awakened"] as const).map((st) => [`ally-${k}-${st}`, () => scene(party, st)])),
);
