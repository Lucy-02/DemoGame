// 아직 정하지 않은 그림 자리. 정본 시안의 임시 도형(실루엣·적 도형·카드 그림)을 그대로 쓰지 않고,
// 자리와 크기만 보이는 X 상자로 비워 둬요. 그림이 정해지면 이 호출을 실제 그림으로 바꿔요.
import type * as Phaser from "phaser";
import { rgba } from "./color";

export function placeholderArt(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, color: string,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  strokePlaceholder(g, x, y, w, h, color);
  return g;
}

/** 같은 X 상자를 이미 있는 그래픽에 그려요. 아직 없는 기호 자리도 이 모양이에요 (0137: 점선 네모는 빈 칸에만) */
export function strokePlaceholder(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: string, alpha = 1) {
  const c = rgba(color);
  g.lineStyle(1, c.color, c.alpha * alpha);
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.lineBetween(x, y, x + w, y + h).lineBetween(x + w, y, x, y + h);
}
