// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { spiritDef, personalityDef } from "../core/data";
import { FLOORS, getRun } from "../core/run";
import { maxHpOf } from "../core/stats";
import { COLORS, W, bar, button, txt } from "./widgets";

/** 런 화면 공통 상단 바: 층, 골드, 정령 HP, 덱 보기 */
export function runHud(scene: Phaser.Scene) {
  const run = getRun();
  const c = scene.add.container(0, 0).setDepth(50);
  c.add(scene.add.rectangle(0, 0, W, 44, 0x0e0c15, 0.9).setOrigin(0, 0));
  const floor = run.current ? (run.current.type === "boss" ? "보스" : `${run.current.floor}층`) : "출발";
  c.add(txt(scene, 16, 22, `1막 · ${floor} / ${FLOORS + 1}`, 17).setOrigin(0, 0.5));
  c.add(txt(scene, 170, 22, `골드 ${run.gold}`, 17, COLORS.gold).setOrigin(0, 0.5));
  let x = 300;
  for (const s of run.spirits) {
    const d = spiritDef(s.id);
    const max = maxHpOf(s);
    const front = run.frontId === s.id ? "▶" : "";
    const pers = s.adult ? personalityDef(s.personality).name : "???";
    c.add(txt(scene, x, 22, `${front}${d.name}`, 15).setOrigin(0, 0.5));
    c.add(bar(scene, x + 64, 22, 110, 16, s.hp / max, COLORS.hp, `${s.hp}/${max}`));
    c.add(txt(scene, x + 180, 22, pers, 12, COLORS.dim).setOrigin(0, 0.5));
    x += 235;
  }
  c.add(button(scene, W - 70, 22, 110, 32, `덱 ${run.deck.length}장`, () => {
    scene.scene.launch("DeckScene", { mode: "view", from: scene.scene.key });
    scene.scene.pause();
  }, { size: 15, color: 0x3f3758 }));
  return c;
}
