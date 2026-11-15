// 툴팁 그리기와 띄우기. 판(바탕·테·그림자) + 블록(머리, 문단) + 선택 꼬리.
// 카드 말풍선, 적 설명판이 이걸 써요. 상태이상·해결 순서표 칸처럼 호버로 뜨는 정보도 TooltipHost.attach로 붙여요.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { rgba } from "../style/color";
import { box } from "../style/draw";
import { cubicBezier, ms } from "../style/ease";
import { render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { shadowTexture } from "../style/shadow";
import { inlineLine, lineBox, wrapSpans, type Span } from "../style/text";
import type { RichText, TipBlock, TipContent } from "./content";
import type { RoleStyle, TipSkin } from "./skins";

/** 판을 놓을 자리. top 또는 bottom 중 하나. tailX = 꼬리 가운데 (판 왼쪽 기준) */
export type TipPlace = { left: number; top: number; tailX?: number } | { left: number; bottom: number; tailX?: number };

export interface TooltipSpec {
  skin: TipSkin;
  content: TipContent;
  at: TipPlace;
}

const spans = (r: RichText, s: RoleStyle, termOffset?: number): Span[] =>
  r.map((p) => ({
    text: p.text,
    size: p.strong ? s.strongSize : s.size,
    color: p.strong ? s.strongColor : s.color,
    dotted: p.term && termOffset !== undefined ? { offset: termOffset, color: s.color } : undefined,
  }));

/** 블록 하나를 재고, 그리는 함수를 돌려줘요 */
function layoutBlock(skin: TipSkin, b: TipBlock, inner: number): { h: number; draw: (scene: Phaser.Scene, x: number, y: number) => void } {
  if (b.kind === "title") {
    const t = skin.title;
    if (!t) throw new Error("이 스킨에는 머리(title) 모양이 없어요");
    const node: Node = {
      t: "row", align: "center", gap: t.gap,
      children: [
        { t: "text", text: b.text, size: t.size, color: t.color, lh: t.lh },
        ...(b.tag ? [{
          t: "row", pad: [0, t.tag.padX, 0, t.tag.padX], radius: t.tag.radius,
          style: { ring: { width: t.tag.ring, color: t.tag.ringColor } },
          children: [{ t: "text", text: b.tag, size: t.tag.size, color: t.tag.color, lh: t.lh }],
        } as Node] : []),
      ],
    };
    return { h: size(node).h, draw: (scene, x, y) => { render(scene, node, x, y); } };
  }
  const s = skin.roles[b.role];
  if (!s) throw new Error(`이 스킨에는 "${b.role}" 문단 모양이 없어요`);
  const lines = wrapSpans(spans(b.text, s, skin.termOffset), inner);
  const pad = s.padTop ?? 0;
  const h = pad + lines.reduce((a, l) => { const lb = lineBox(s.size, l, s.lh); return a + lb.above + lb.below; }, 0);
  return {
    h,
    draw: (scene, x, y) => {
      let cy = y + pad;
      for (const l of lines) cy += inlineLine(scene, x, cy, s.size, l, s.lh).height;
    },
  };
}

/** 판 크기만 재요 (놓을 자리를 정하기 전에) */
export function measureTooltip(skin: TipSkin, content: TipContent) {
  const [pt, pr, pb, pl] = skin.pad;
  const blocks = content.map((b) => layoutBlock(skin, b, skin.w - pl - pr));
  const h = pt + blocks.reduce((a, b) => a + b.h, 0) + skin.gap * Math.max(0, blocks.length - 1) + pb;
  return { w: skin.w, h, blocks };
}

/** 툴팁을 그려요. 돌려주는 Container 원점은 판 왼쪽 위예요. */
export function drawTooltip(scene: Phaser.Scene, spec: TooltipSpec): Phaser.GameObjects.Container {
  const { skin, at } = spec;
  const { w, h, blocks } = measureTooltip(skin, spec.content);
  const top = "top" in at ? at.top : at.bottom - h;
  const [pt, , , pl] = skin.pad;
  return gather(scene, at.left, top, () => {
    const sh = shadowTexture(scene, w, h, skin.radius, skin.shadow);
    scene.add.image(-sh.margin, -sh.margin, sh.key).setOrigin(0, 0);
    const g = scene.add.graphics();
    box(g, 0, 0, w, h, skin.radius, { fill: skin.fill, ring: skin.ring });
    if (skin.tail && at.tailX !== undefined) drawTail(g, skin, at.tailX, h);
    let y = pt;
    blocks.forEach((b, i) => {
      if (i > 0) y += skin.gap;
      b.draw(scene, pl, y);
      y += b.h;
    });
  });
}

/** 꼬리: 45° 돌린 정사각형의 아래 절반 + 아래 두 변의 선 (box-shadow 1px 1px) */
function drawTail(g: Phaser.GameObjects.Graphics, skin: TipSkin, x: number, h: number) {
  const t = skin.tail!;
  const half = (t.size * Math.SQRT2) / 2;
  const line = rgba(t.lineColor);
  g.lineStyle(t.line, line.color, line.alpha)
    .lineBetween(x - half, h + t.line * Math.SQRT1_2, x, h + half + t.line * Math.SQRT2)
    .lineBetween(x, h + half + t.line * Math.SQRT2, x + half, h + t.line * Math.SQRT1_2);
  const fill = rgba(skin.fill);
  g.fillStyle(fill.color, fill.alpha)
    .fillTriangle(x - half, h, x, h - half, x + half, h)
    .fillTriangle(x - half, h, x, h + half, x + half, h);
}

/** 판이 화면 밖으로 나가지 않게 왼쪽 끝을 맞춰요 */
export function clampLeft(left: number, w: number, screenW: number, edge: number) {
  return Math.max(edge, Math.min(screenW - edge - w, left));
}

const ease = cubicBezier(tokens.provisional.motion.hover.easing);
const duration = ms(tokens.provisional.motion.hover.duration);

/**
 * 호버 툴팁을 한 번에 하나만 띄우는 자리. 새로 띄우면 앞의 것은 닫혀요.
 * attach로 게임 오브젝트에 붙이면 포인터가 올라갈 때 뜨고 나갈 때 닫혀요.
 */
export class TooltipHost {
  private current: Phaser.GameObjects.Container | null = null;
  private owner: unknown = null;

  constructor(private scene: Phaser.Scene) {}

  /** owner: 누가 띄웠는지 (같은 owner의 hide만 닫아요) */
  show(spec: TooltipSpec, opts: { instant?: boolean; owner?: unknown } = {}) {
    this.hide();
    const tip = drawTooltip(this.scene, spec);
    this.current = tip;
    this.owner = opts.owner ?? null;
    const enter = spec.skin.enterY;
    if (!opts.instant && enter) {
      const y = tip.y;
      tip.setAlpha(0).setY(y + enter);
      this.scene.tweens.add({ targets: tip, alpha: 1, y, duration, ease });
    }
    return tip;
  }

  hide(owner?: unknown) {
    if (!this.current || (owner !== undefined && owner !== this.owner)) return;
    this.scene.tweens.killTweensOf(this.current);
    this.current.destroy();
    this.current = null;
    this.owner = null;
  }

  /** target에 포인터가 올라가면 spec()을 띄워요. target은 setInteractive가 된 오브젝트여야 해요. */
  attach(target: Phaser.GameObjects.GameObject, spec: () => TooltipSpec) {
    target.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.show(spec(), { owner: target }));
    target.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.hide(target));
  }
}
