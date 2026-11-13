// 왼쪽 세로 메뉴와 오른쪽 아래 강조 버튼. 유리 판·글자·배지는 정령 관리 조각(spirits/views/parts)을 그대로 써요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { faceTexture } from "../../spiritArt";
import { box } from "../../style/draw";
import { render, size, type BoxNode, type Node } from "../../style/flex";
import { P, glass, text } from "../../spirits/views/parts";
import { COPY } from "../copy";
import { LOGO, MENU, PRIMARY, primaryRight, primaryY } from "../layout";
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
  const F = MENU.fresh;
  return {
    t: "row", h: F.h, radius: F.radius, pad: [0, F.padX, 0, F.padX], align: "center", ml: "auto",
    style: { ring: { width: F.ring, color: P.accHi } }, children: [text(COPY.new, T.badge, P.accHi)],
  };
}

export const rowY = (i: number) => MENU.y + i * (MENU.row.h + MENU.gap);

/** 메뉴 줄 하나: 기호 + 낱말, 줄 끝에 숫자 또는 `새` */
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

/** 오른쪽 아래 강조 버튼. 이어하기면 함께 간 정령 얼굴과 층을 붙여요 */
export function drawPrimary(scene: Phaser.Scene, vm: HomePrimaryVM, onClick?: () => void) {
  const S = PRIMARY;
  const F = S.face;
  // 얼굴은 바탕 원(P.face) 위에 올려요. 그림이 없는 정령은 바탕 원만 남아요
  const faces: Node[] = vm.kind !== "continue" ? [] : [{
    t: "row", gap: F.gap, ml: F.ml, align: "center",
    children: vm.faces.map((f): Node => ({
      t: "row", round: true, w: F.d, h: F.d, style: { fill: P.face },
      children: f && scene.textures.exists(f.key) ? [{ t: "image", key: faceTexture(scene, f, F.d), w: F.d, h: F.d, round: true }] : [],
    })),
  }];
  const node: BoxNode = {
    t: "row", h: S.h, radius: S.radius, pad: [0, S.padX, 0, S.padX], gap: S.gap, align: "center", style: { fill: P.acc },
    children: [
      { t: "icon", id: "g-flag", w: S.icon, h: S.icon, tint: P.onAcc },
      text(vm.label, T.item, P.onAcc),
      ...faces,
      ...(vm.kind === "continue" ? [text(vm.floor, T.floor, P.onAcc, { ml: S.floorMl })] : []),
    ],
  };
  const s = size(node);
  const x = primaryRight - s.w;
  render(scene, node, x, primaryY);
  if (onClick) scene.add.zone(x, primaryY, s.w, s.h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", onClick);
}
