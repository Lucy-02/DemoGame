// 예시: 2막 새 규칙 표시 (0096). 실제 전투 규칙으로 만든 장면이에요.
import { Run } from "../../../core/run";
import { BattleSession } from "../../../session/battle";
import { battleVM } from "../fromBattle";
import type { BattleVM } from "../viewmodel";

const PARTY = ["fire_fox", "mist_cat", "glass_salamander"];

function scene(enemies: string[], turns = 0, plays = 0): BattleVM {
  const run = new Run({ seed: 7, frontId: PARTY[0], adult: false, unlockAll: false, party: PARTY, acts: 2 });
  const s = new BattleSession(run, enemies);
  const b = s.battle;
  for (let i = 0; i < turns && b.result === "ongoing"; i++) b.endTurn();
  for (let i = 0; i < plays; i++) {
    const c = b.hand.find((x) => b.canPlay(x).ok);
    if (!c) break;
    const need = b.needsTarget(c);
    const e = b.aliveEnemies().find((x) => !b.buriedAt(x, b.previewEnd(c)));
    b.play(c.uid, need === "enemy" && e ? { side: "e", uid: e.uid } : need === "ally" ? { side: "s", id: c.owner } : undefined);
  }
  return battleVM(b, "2막");
}

/** 방전 띠 (빈 띠) + 가속 + 되돌리기 칩 */
export const exampleAct2Band = () => scene(["spark_bug", "lightning_rod", "mirror_shard"]);
/** 방전 띠 위에 놓은 카드 */
export const exampleAct2Plan = () => scene(["spark_bug", "lightning_rod", "mirror_shard"], 0, 3);
/** 땅속 적 (한 턴 뒤) */
export const exampleAct2Buried = () => scene(["mole", "mirror_shard"], 1, 1);
