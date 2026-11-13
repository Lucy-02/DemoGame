// 오른쪽 위 기록·설정 버튼. 정본 .sys (왼쪽 위 지역·턴 줄은 뺐어요, Lucy 2026-11-13)
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { icon } from "../../style/icons";
import { FRAME, SYS } from "../layout";

const P = tokens.provisional.palette;

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
