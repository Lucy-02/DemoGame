// 오른쪽 위 덱·기록·설정 버튼. 정본 .sys (왼쪽 위 지역·턴 줄은 뺐어요, Lucy 2026-11-13). 덱 버튼은 같은 줄에 (0076 15번)
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { circle } from "../../style/draw";
import { icon } from "../../style/icons";
import { bindMenuKey, hasRunMenu, openRunMenu } from "../../menu/hooks";
import { FRAME, SYS } from "../layout";

const P = tokens.provisional.palette;

export const SYS_ICONS = ["i-deck", "i-log", "i-gear"] as const;
type SysId = (typeof SYS_ICONS)[number];

/** on: 누를 수 있는 버튼 (기록 화면은 아직 없어요). 톱니는 판 안 메뉴를 열어요 (0084).
 *  esc: Esc로도 메뉴를 열어요. Esc를 따로 쓰는 화면(전투: 집은 카드 내려놓기)은 false로 주고 직접 불러요 */
export function drawSys(scene: Phaser.Scene, on: Partial<Record<SysId, () => void>> = {}, esc = true) {
  if (esc) bindMenuKey(scene);
  const inset = (SYS.button - SYS.icon) / 2;
  // 기호마다 둥근 유리 판: 밝은 배경 위에서도 기호가 보이게, 순서표 판과 같은 유리 (0137)
  const g = scene.add.graphics();
  SYS_ICONS.forEach((id, i) => {
    const fromRight = SYS_ICONS.length - 1 - i;
    const x = FRAME.w - SYS.right - SYS.button - fromRight * (SYS.button + SYS.gap);
    circle(g, x + SYS.button / 2, SYS.top + SYS.button / 2, SYS.button, { fill: P.glass, ring: { width: 1, color: P.glassLine } });
    // 정본에서 .ib의 ink-3는 `.frame button{color:inherit}`에 덮여서 실제로는 --ink로 보여요.
    icon(scene, x + inset, SYS.top + inset, id, SYS.icon, SYS.icon, P.ink);
    const click = on[id] ?? (id === "i-gear" && hasRunMenu(scene) ? () => openRunMenu(scene) : undefined);
    if (click) scene.add.zone(x, SYS.top, SYS.button, SYS.button).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", click);
  });
}
