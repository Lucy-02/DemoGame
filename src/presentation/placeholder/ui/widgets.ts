// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { ELEMENT_COLOR, ELEMENT_NAME, RARITY_NAME, cardDef, spiritDef } from "../../../core/data";
import { describeCard, type CasterStats } from "../../../core/text";
import type { ShapeAsset } from "../../../core/data";

export const FONT = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'WenQuanYi Zen Hei', sans-serif";
export const W = 1280;
export const H = 720;

export const COLORS = {
  bg: 0x1b1826,
  panel: 0x2a2538,
  panelLight: 0x3a3450,
  text: "#f2eefc",
  dim: "#a59fbd",
  gold: "#ffd166",
  hp: 0xe0525a,
  block: 0x5aa8ff,
  sync: 0xc58cff,
  shield: 0xffe08a,
};

export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string,
  size = 16, color = COLORS.text, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
) {
  return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, ...opts });
}

export function button(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string,
  onClick: () => void, opts: { color?: number; size?: number; disabled?: boolean } = {},
) {
  const c = scene.add.container(x, y);
  const color = opts.disabled ? 0x4a4458 : (opts.color ?? 0x6b4fd8);
  const bg = scene.add.rectangle(0, 0, w, h, color).setStrokeStyle(2, 0xffffff, 0.25);
  const t = txt(scene, 0, 0, label, opts.size ?? 18, opts.disabled ? COLORS.dim : "#ffffff", { align: "center" }).setOrigin(0.5);
  c.add([bg, t]);
  c.setSize(w, h);
  if (!opts.disabled) {
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).lighten(12).color));
    bg.on("pointerout", () => bg.setFillStyle(color));
    bg.on("pointerdown", onClick);
  }
  return c;
}

export function bar(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, ratio: number, color: number, label?: string,
) {
  const g = scene.add.container(x, y);
  g.add(scene.add.rectangle(0, 0, w, h, 0x000000, 0.55).setOrigin(0, 0.5));
  g.add(scene.add.rectangle(1, 0, Math.max(0, (w - 2) * Math.min(1, ratio)), h - 2, color).setOrigin(0, 0.5));
  if (label) g.add(txt(scene, w / 2, 0, label, Math.min(14, h + 1), "#ffffff", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));
  return g;
}

/** 플레이스홀더 도형. 실제 아트가 나오면 assets.json에서 image/spine으로 바꾸면 돼요. */
export function drawShape(scene: Phaser.Scene, a: ShapeAsset, flip = false): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const col = Phaser.Display.Color.HexStringToColor(a.color).color;
  const dark = Phaser.Display.Color.ValueToColor(col).darken(30).color;
  const s = a.size;
  const g = scene.add.graphics();
  const dir = flip ? -1 : 1;
  g.fillStyle(0x000000, 0.25).fillEllipse(0, s * 0.5, s * 1.0, s * 0.18);
  g.fillStyle(col, 1);
  g.lineStyle(3, dark, 1);
  switch (a.shape) {
    case "bird":
      g.fillEllipse(0, 0, s * 0.9, s * 0.8).strokeEllipse(0, 0, s * 0.9, s * 0.8);
      g.fillStyle(dark).fillTriangle(dir * s * 0.4, -s * 0.05, dir * s * 0.62, s * 0.05, dir * s * 0.4, s * 0.12);
      g.fillStyle(0xffd27a).fillTriangle(-dir * s * 0.42, 0, -dir * s * 0.75, -s * 0.3, -dir * s * 0.6, s * 0.15);
      g.fillStyle(col).fillEllipse(0, s * 0.05, s * 0.5, s * 0.3);
      break;
    case "turtle":
      g.fillStyle(dark).fillEllipse(dir * s * 0.5, s * 0.05, s * 0.32, s * 0.28);
      g.fillStyle(col).fillEllipse(0, 0, s, s * 0.7).strokeEllipse(0, 0, s, s * 0.7);
      g.lineStyle(2, dark).strokeCircle(-s * 0.15, -s * 0.05, s * 0.12).strokeCircle(s * 0.15, -s * 0.05, s * 0.12);
      break;
    case "seed":
      g.fillCircle(0, 0, s * 0.38).strokeCircle(0, 0, s * 0.38);
      g.fillStyle(0xffffff, 0.8);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        g.fillCircle(Math.cos(ang) * s * 0.5, Math.sin(ang) * s * 0.5 - s * 0.05, s * 0.08);
      }
      break;
    case "orb":
      g.fillStyle(col, 0.4).fillCircle(0, 0, s * 0.6);
      g.fillStyle(col, 1).fillCircle(0, 0, s * 0.38);
      break;
    case "mushroom":
      g.fillStyle(0xeeddc8).fillRect(-s * 0.15, -s * 0.05, s * 0.3, s * 0.45);
      g.fillStyle(col).fillEllipse(0, -s * 0.1, s, s * 0.6).strokeEllipse(0, -s * 0.1, s, s * 0.6);
      break;
    case "block":
      g.fillRoundedRect(-s * 0.4, -s * 0.45, s * 0.8, s * 0.9, 10).strokeRoundedRect(-s * 0.4, -s * 0.45, s * 0.8, s * 0.9, 10);
      g.fillStyle(0xffc04d).fillCircle(dir * -s * 0.15, -s * 0.2, s * 0.06).fillCircle(dir * s * 0.1, -s * 0.2, s * 0.06);
      break;
    case "witch":
      g.fillTriangle(0, -s * 0.6, -s * 0.35, s * 0.45, s * 0.35, s * 0.45).strokeTriangle(0, -s * 0.6, -s * 0.35, s * 0.45, s * 0.35, s * 0.45);
      g.fillStyle(dark).fillEllipse(0, -s * 0.15, s * 0.7, s * 0.12);
      break;
    case "wolf":
      g.fillEllipse(0, 0, s, s * 0.55).strokeEllipse(0, 0, s, s * 0.55);
      g.fillTriangle(dir * -s * 0.4, -s * 0.15, dir * -s * 0.3, -s * 0.45, dir * -s * 0.15, -s * 0.18);
      break;
    case "imp":
      g.fillCircle(0, 0, s * 0.35).strokeCircle(0, 0, s * 0.35);
      g.fillTriangle(-s * 0.25, -s * 0.2, -s * 0.35, -s * 0.55, -s * 0.08, -s * 0.3);
      g.fillTriangle(s * 0.25, -s * 0.2, s * 0.35, -s * 0.55, s * 0.08, -s * 0.3);
      break;
    case "tree":
      g.fillStyle(dark).fillRect(-s * 0.12, -s * 0.05, s * 0.24, s * 0.55);
      g.fillStyle(0x4b6b35).fillCircle(0, -s * 0.25, s * 0.38).fillCircle(-s * 0.25, -s * 0.05, s * 0.25).fillCircle(s * 0.25, -s * 0.05, s * 0.25);
      g.fillStyle(0xffe066).fillCircle(-s * 0.1, -s * 0.2, s * 0.04).fillCircle(s * 0.1, -s * 0.2, s * 0.04);
      break;
    default:
      g.fillEllipse(0, s * 0.1, s, s * 0.75).strokeEllipse(0, s * 0.1, s, s * 0.75);
  }
  // 눈
  if (!["tree", "block", "orb"].includes(a.shape)) {
    g.fillStyle(0x1b1826).fillCircle(-dir * s * 0.12 - (flip ? 0 : 0), -s * 0.08, s * 0.05).fillCircle(dir * s * 0.12, -s * 0.08, s * 0.05);
  }
  c.add(g);
  return c;
}

export const CARD_W = 128;
export const CARD_H = 178;

/** 카드 한 장. owner의 능력치로 최종 수치를 보여줘요. */
export function cardView(
  scene: Phaser.Scene, cardId: string, owner: string | null, stats: CasterStats | null,
  opts: { cost?: number; disabled?: boolean; note?: string; copy?: boolean } = {},
) {
  const def = cardDef(cardId);
  const c = scene.add.container(0, 0);
  const col = ELEMENT_COLOR[def.element];
  const ownerCol = owner ? ELEMENT_COLOR[spiritDef(owner).element] : 0x777777;
  const bg = scene.add.rectangle(0, 0, CARD_W, CARD_H, 0x221e2e).setStrokeStyle(3, ownerCol);
  const top = scene.add.rectangle(0, -CARD_H / 2 + 22, CARD_W - 6, 40, col, 0.85);
  const name = txt(scene, 8, -CARD_H / 2 + 22, def.name, def.name.length > 6 ? 13 : 15, "#fff", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5);
  const cost = opts.cost ?? def.cost;
  const costColor = cost < def.cost ? "#7dff9a" : cost > def.cost ? "#ff8a8a" : "#ffffff";
  const costBg = scene.add.circle(-CARD_W / 2 + 14, -CARD_H / 2 + 14, 15, 0x14121c).setStrokeStyle(2, 0xb9a6ff);
  const costT = txt(scene, -CARD_W / 2 + 14, -CARD_H / 2 + 14, `${cost}`, 18, costColor).setOrigin(0.5);
  const meta = txt(scene, 0, -CARD_H / 2 + 52, `${ELEMENT_NAME[def.element]} · ${RARITY_NAME[def.rarity]}`, 11, COLORS.dim).setOrigin(0.5);
  const body = txt(scene, 0, 8, describeCard(def, stats), 13, COLORS.text, {
    wordWrap: { width: CARD_W - 14, useAdvancedWrap: true }, align: "center",
  }).setOrigin(0.5);
  const ownerName = owner ? spiritDef(owner).name : "미정";
  const foot = txt(scene, 0, CARD_H / 2 - 14, opts.note ?? `${ownerName}${opts.copy ? " · 복사본" : ""}`, 12, "#ffffff").setOrigin(0.5);
  const footBg = scene.add.rectangle(0, CARD_H / 2 - 14, CARD_W - 6, 22, ownerCol, 0.5);
  c.add([bg, top, name, costBg, costT, meta, body, footBg, foot]);
  c.setSize(CARD_W, CARD_H);
  if (opts.disabled) c.setAlpha(0.55);
  return c;
}

export function toast(scene: Phaser.Scene, msg: string, color = "#ffffff") {
  const t = txt(scene, W / 2, H / 2 - 40, msg, 22, color, { stroke: "#000", strokeThickness: 5 }).setOrigin(0.5).setDepth(1000);
  scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, delay: 600, duration: 500, onComplete: () => t.destroy() });
}

export function bgFill(scene: Phaser.Scene, top = 0x231f33, bottom = 0x14121c) {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, W, H);
  return g;
}
