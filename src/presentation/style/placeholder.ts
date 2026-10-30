// 아직 정하지 않은 그림 자리. 정본 시안의 임시 도형(실루엣·적 도형·카드 그림)을 그대로 쓰지 않고,
// 자리와 크기만 보이는 X 상자로 비워 둬요. 그림이 정해지면 이 호출을 실제 그림으로 바꿔요.
import type * as Phaser from "phaser";
import { rgba } from "./color";

export function placeholderArt(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, color: string,
): Phaser.GameObjects.Graphics {
  const c = rgba(color);
  const g = scene.add.graphics().lineStyle(1, c.color, c.alpha);
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.lineBetween(x, y, x + w, y + h).lineBetween(x + w, y, x, y + h);
  return g;
}
