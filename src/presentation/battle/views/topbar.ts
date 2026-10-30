// 왼쪽 위 지역·턴 줄과 오른쪽 위 기록·설정 버튼. 정본 .top .where, .sys
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { icon } from "../../style/icons";
import { inlineLine } from "../../style/text";
import { COPY } from "../copy";
import { FRAME, SYS, WHERE } from "../layout";
import type { BattleVM } from "../viewmodel";

const P = tokens.palette;
const T = tokens.text.battle;

export function drawWhere(scene: Phaser.Scene, vm: BattleVM["where"]) {
  const quiet = { size: T.where, color: P.ink3 };
  const num = { size: T.whereNum, color: P.ink };
  return inlineLine(scene, WHERE.x, WHERE.y, WHERE.strut, [
    { text: `${vm.area} `, ...quiet },
    { text: String(vm.floor), ...num },
    { text: `${COPY.floorUnit} `, ...quiet },
    { text: COPY.dot, ...quiet, ml: WHERE.dotMargin, mr: WHERE.dotMargin },
    { text: ` ${COPY.turn} `, ...quiet },
    { text: String(vm.turn), ...num },
  ]);
}

export const SYS_ICONS = ["i-log", "i-gear"] as const;

export function drawSys(scene: Phaser.Scene) {
  const inset = (SYS.button - SYS.icon) / 2;
  SYS_ICONS.forEach((id, i) => {
    const fromRight = SYS_ICONS.length - 1 - i;
    const x = FRAME.w - SYS.right - SYS.button - fromRight * (SYS.button + SYS.gap);
    // 정본에서 .ib의 ink-3는 `.frame button{color:inherit}`에 덮여서 실제로는 --ink로 보여요.
    icon(scene, x + inset, SYS.top + inset, id, SYS.icon, SYS.icon, P.ink);
  });
}
