// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { FLOORS, getRun, type MapNode, type NodeType } from "../core/run";
import { runHud } from "../ui/hud";
import { COLORS, H, bgFill, txt } from "../ui/widgets";

const NODE_STYLE: Record<NodeType, { label: string; color: number }> = {
  battle: { label: "전투", color: 0x8c4a4a },
  elite: { label: "정예", color: 0xc0392b },
  event: { label: "이벤트", color: 0x4a6f8c },
  shop: { label: "상점", color: 0xb08a2e },
  rest: { label: "휴식", color: 0x3f7a55 },
  boss: { label: "보스", color: 0x5a2d82 },
};

export class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
  }

  create() {
    const run = getRun();
    bgFill(this, 0x1f2a24, 0x14121c);
    runHud(this);

    const pos = (n: MapNode) => ({
      x: n.type === "boss" ? 640 : 400 + n.col * 160,
      y: H - 60 - ((n.floor - 1) / FLOORS) * (H - 170),
    });
    const g = this.add.graphics();
    for (const n of run.map.values()) {
      for (const k of n.next) {
        const m = run.map.get(k)!;
        const a = pos(n), b = pos(m);
        const walked = run.visited.includes(n.id) && run.visited.includes(m.id);
        g.lineStyle(walked ? 4 : 2, walked ? 0xffd166 : 0x6b6480, walked ? 0.9 : 0.6);
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
    const reachable = new Set(run.reachable().map((n) => n.id));
    for (const n of run.map.values()) {
      const { x, y } = pos(n);
      const st = NODE_STYLE[n.type];
      const r = n.type === "boss" ? 44 : 28;
      const visited = run.visited.includes(n.id);
      const can = reachable.has(n.id);
      const circle = this.add.circle(x, y, r, st.color, visited ? 1 : can ? 1 : 0.45)
        .setStrokeStyle(visited ? 4 : 2, visited ? 0xffd166 : can ? 0xffffff : 0x000000, can || visited ? 1 : 0.4);
      txt(this, x, y, st.label, n.type === "boss" ? 18 : 13, can || visited ? "#ffffff" : "#bbbbbb").setOrigin(0.5);
      if (can) {
        this.tweens.add({ targets: circle, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });
        circle.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.enter(n));
      }
    }
    txt(this, 24, 70, "다음 칸을 고르세요", 20).setOrigin(0, 0.5);
    const legend = Object.values(NODE_STYLE).map((s) => s.label).join(" · ");
    txt(this, 24, 100, legend, 13, COLORS.dim).setOrigin(0, 0.5);
    txt(this, 24, 140, "상성: 물 > 불 > 숲 > 물 (×1.5)\n테스투(물)는 불 적을\n이그니(불)는 숲 적을\n실바(숲)는 물 적을 맡아요.\n바람은 중립이에요.", 13, COLORS.dim, { lineSpacing: 4 }).setOrigin(0, 0);
  }

  private enter(n: MapNode) {
    const run = getRun();
    run.enter(n);
    switch (n.type) {
      case "battle":
      case "elite":
      case "boss": {
        const enc = run.pickEncounter(n.type);
        this.scene.start("BattleScene", { enemies: enc.enemies, kind: n.type });
        break;
      }
      case "event":
        this.scene.start("EventScene");
        break;
      case "shop":
        this.scene.start("ShopScene");
        break;
      case "rest":
        this.scene.start("RestScene");
        break;
    }
  }
}
