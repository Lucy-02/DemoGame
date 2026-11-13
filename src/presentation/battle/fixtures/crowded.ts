// 예시: 꽉 찬 정보판 (전투 정보판 C안 ③). 상태 다섯이 걸린 적, 받을 피해로 쓰러지는 아군(치명 테·충격 기호 맥박).
import type { BattleVM } from "../viewmodel";
import { canonRest } from "./canonRest";

export const exampleCrowded: BattleVM = {
  ...canonRest,
  allies: canonRest.allies.map((a, i) => (i === 0 ? { ...a, hp: 14 } : a)),
  enemies: canonRest.enemies.map((e, i) => ({
    ...e,
    hovered: false,
    statuses: i === 0
      ? [{ icon: "kw-burn", n: 3 }, { icon: "kw-vuln", n: 2 }, { icon: "kw-weak", n: 1 }, { icon: "kw-chill", n: 2 }, { icon: "kw-thorns", n: 1 }]
      : e.statuses,
  })),
};
