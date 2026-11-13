// 왼쪽 세로 메뉴. 맨 위가 강조 줄(탐험 떠나기 / 이어하기)이에요. 유리 판·글자·배지는 정령 관리 조각(spirits/views/parts)을 그대로 써요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { faceTexture } from "../../spiritArt";
import { box } from "../../style/draw";
import { render, type BoxNode, type Node } from "../../style/flex";
import { P, glass, text } from "../../spirits/views/parts";
import { COPY } from "../copy";
import { LOGO, MENU, PRIMARY } from "../layout";
import type { HomeBadge, HomeItemVM, HomePrimaryVM } from "../viewmodel";

const T = tokens.provisional.text.home;

export const MENU_ICONS = [["g-flag", PRIMARY.icon], ["i-log", MENU.row.icon], ["i-gear", MENU.row.icon]] as const;

/** 게임 이름 자리. 이름이 정해지기 전이라 점선 테로 비워 둬요 */
export function drawLogo(scene: Phaser.Scene, title: string) {
  render(scene, {
    t: "row", pad: [LOGO.padY, LOGO.padX, LOGO.padY, LOGO.padX], radius: LOGO.radius, align: "center",
    style: { ring: { width: LOGO.ring, color: P.glassLine, dash: LOGO.dash } },
    children: [text(title, T.logo, P.ink)],
  }, LOGO.x, LOGO.y);
}

/** 기호가 아직 없는 자리 (TODO_ICON): 점선 둥근 네모 */
const todoSlot = (d: number, color: string): Node => ({
  t: "block", w: d, h: d,
  draw: (g, x, y, w, h) => box(g, x, y, w, h, MENU.todo.radius, { ring: { width: MENU.todo.ring, color, dash: MENU.todo.dash } }),
});

function badgeNode(b: HomeBadge): Node {
  if (b.kind === "count") {
    const d = MENU.count.d;
    return { t: "row", round: true, w: d, h: d, justify: "center", align: "center", ml: "auto", style: { fill: P.ink }, children: [text(String(b.n), T.badge, P.floor)] };
  }
  // 새것 표시: 빨간 원에 N (Lucy 2026-11-13)
  const d = MENU.count.d;
  return { t: "row", round: true, w: d, h: d, justify: "center", align: "center", ml: "auto", style: { fill: P.danger }, children: [text(COPY.new, T.badge, P.onDanger)] };
}

export const rowY = (i: number) => MENU.y + PRIMARY.h + PRIMARY.below + i * (MENU.row.h + MENU.gap);

/** 메뉴 줄 하나: 기호 + 낱말, 줄 끝에 숫자 또는 `N` */
export function drawItem(scene: Phaser.Scene, item: HomeItemVM, i: number, hover: boolean, on: { click: () => void; over: () => void; out: () => void }) {
  const R = MENU.row;
  const node: BoxNode = {
    t: "row", w: MENU.w, h: R.h, radius: R.radius, pad: [0, R.padX, 0, R.padX], gap: R.gap, align: "center",
    style: hover ? { fill: P.veil["09"], ring: { width: 1, color: P.veil["50"] } } : glass(),
    children: [
      item.icon ? { t: "icon", id: item.icon, w: R.icon, h: R.icon, tint: P.ink } : todoSlot(R.icon, P.ink2),
      text(item.label, T.item, P.ink),
      ...(item.badge ? [badgeNode(item.badge)] : []),
    ],
  };
  const y = rowY(i);
  render(scene, node, MENU.x, y);
  scene.add.zone(MENU.x, y, MENU.w, R.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    .on("pointerover", on.over).on("pointerout", on.out).on("pointerup", on.click);
}

/** 강조 줄 채움은 Lucy가 고르는 중이에요 (보라 채움은 기각, 2026-11-13). 그때까지 밝은 유리 판이에요 */
const TONE = { style: { fill: P.veil["09"], ring: { width: PRIMARY.ring, color: P.veil["50"] } }, ink: P.ink };

/** 메뉴 맨 위 강조 줄. 이어하기면 함께 간 정령 얼굴과 층을 붙여요 */
export function drawPrimary(scene: Phaser.Scene, vm: HomePrimaryVM, onClick?: () => void) {
  const S = PRIMARY;
  const F = S.face;
  const tone = TONE;
  // 얼굴은 바탕 원(P.face) 위에 올려요. 그림이 없는 정령은 바탕 원만 남아요
  const faces: Node[] = vm.kind !== "continue" ? [] : [{
    t: "row", gap: F.gap, ml: F.ml, align: "center",
    children: vm.faces.map((f): Node => ({
      t: "row", round: true, w: F.d, h: F.d, style: { fill: P.face },
      children: f && scene.textures.exists(f.key) ? [{ t: "image", key: faceTexture(scene, f, F.d), w: F.d, h: F.d, round: true }] : [],
    })),
  }];
  const node: BoxNode = {
    t: "row", w: MENU.w, h: S.h, radius: S.radius, pad: [0, S.padX, 0, S.padX], gap: S.gap, align: "center", style: tone.style,
    children: [
      { t: "icon", id: "g-flag", w: S.icon, h: S.icon, tint: tone.ink },
      text(vm.label, T.primary, tone.ink),
      ...faces,
      ...(vm.kind === "continue" ? [text(vm.floor, T.floor, tone.ink, { ml: S.floorMl })] : []),
    ],
  };
  render(scene, node, MENU.x, MENU.y);
  if (onClick) scene.add.zone(MENU.x, MENU.y, MENU.w, S.h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", onClick);
}
