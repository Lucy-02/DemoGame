// 그리기 함수가 장면에 바로 올린 객체들을 한 Container로 모아요.
// 카드·묶음처럼 통째로 움직이거나 키울 것을 기존 그리기 코드 그대로 만들 때 써요.
import * as Phaser from "phaser";

/** draw 안에서 만든 객체를 (x, y)에 놓인 Container 안으로 옮겨요. draw는 Container 기준 좌표로 그려요. */
export function gather(scene: Phaser.Scene, x: number, y: number, draw: () => void): Phaser.GameObjects.Container {
  const before = new Set(scene.children.list);
  draw();
  const made = scene.children.list.filter((o) => !before.has(o));
  return scene.add.container(x, y, made);
}
