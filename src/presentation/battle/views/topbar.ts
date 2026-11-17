// 오른쪽 위 덱·기록·설정 버튼. 정본 .sys (왼쪽 위 지역·턴 줄은 뺐어요, Lucy 2026-11-13). 덱 버튼은 같은 줄에 (0076 15번)
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { icon } from "../../style/icons";
import { FRAME, SYS } from "../layout";

const P = tokens.provisional.palette;

export const SYS_ICONS = ["i-deck", "i-log", "i-gear"] as const;
type SysId = (typeof SYS_ICONS)[number];

/** on: 누를 수 있는 버튼 (기록 · 설정 화면은 아직 없어요) */
export function drawSys(scene: Phaser.Scene, on: Partial<Record<SysId, () => void>> = {}) {
  const inset = (SYS.button - SYS.icon) / 2;
  SYS_ICONS.forEach((id, i) => {
    const fromRight = SYS_ICONS.length - 1 - i;
    const x = FRAME.w - SYS.right - SYS.button - fromRight * (SYS.button + SYS.gap);
    // 정본에서 .ib의 ink-3는 `.frame button{color:inherit}`에 덮여서 실제로는 --ink로 보여요.
    icon(scene, x + inset, SYS.top + inset, id, SYS.icon, SYS.icon, P.ink);
    const click = on[id];
    if (click) scene.add.zone(x, SYS.top, SYS.button, SYS.button).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", click);
  });
}
