// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { ASSETS, C, ELEMENT_COLOR, ELEMENT_NAME, ROLE_NAME, cardDef, type VisualAsset } from "../core/data";
import { Battle, type BCard, type BEnemy, type BSpirit, type BattleEvent, type Ref } from "../core/battle";
import { Rng } from "../core/rng";
import { getRun } from "../core/run";
import type { Element } from "../core/types";
import { makeVisual, type Visual } from "../ui/visual";
import { CARD_H, CARD_W, COLORS, H, W, bar, bgFill, button, cardView, toast, txt } from "../ui/widgets";

interface UnitView {
  root: Phaser.GameObjects.Container;
  visual: Visual;
  hud: Phaser.GameObjects.Container;
  zone: Phaser.GameObjects.Rectangle;
  size: number;
}

const KIND_NAME = { battle: "전투", elite: "정예", boss: "보스" } as const;
const INTENT_COLOR: Record<string, number> = {
  attack: 0x9b3b3b, defend: 0x3b5f9b, debuff: 0x6b3b9b, buff: 0x9b7b3b, charge: 0xc26a1a, chargeReady: 0xd02a2a, skip: 0x4a6a8a,
};

function sizeOf(a: VisualAsset | undefined): number {
  if (!a) return 80;
  if (a.type === "shape") return a.size;
  if (a.type === "spine") return a.size ?? a.fallback?.size ?? 110;
  return 100;
}

export class BattleScene extends Phaser.Scene {
  private battle!: Battle;
  private kind: "battle" | "elite" | "boss" = "battle";
  private enemyIds: string[] = [];
  private spiritViews = new Map<string, UnitView>();
  private enemyViews = new Map<number, UnitView>();
  private handLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  private tooltip!: Phaser.GameObjects.Container;
  private hint!: Phaser.GameObjects.Text;
  private logLines: string[] = [];
  private logText!: Phaser.GameObjects.Text;
  private selected: BCard | null = null;
  private busy = false;
  private finished = false;

  constructor() {
    super("BattleScene");
  }

  init(data: { enemies: string[]; kind: "battle" | "elite" | "boss" }) {
    this.enemyIds = data.enemies;
    this.kind = data.kind;
    this.spiritViews.clear();
    this.enemyViews.clear();
    this.logLines = [];
    this.selected = null;
    this.busy = false;
    this.finished = false;
  }

  create() {
    const run = getRun();
    bgFill(this, this.kind === "boss" ? 0x2c1f2a : 0x1f2a2a, 0x14121c);
    this.add.ellipse(W / 2, 470, W * 1.1, 160, 0x000000, 0.25);
    this.battle = new Battle(run.spirits, run.deck, this.enemyIds, run.frontId, new Rng(run.rng.int(0, 1e9)));

    for (const s of this.battle.spirits) {
      const v = makeVisual(this, "spirits", s.id, false);
      this.spiritViews.set(s.id, this.unitView(v, sizeOf(ASSETS.spirits[s.id]), { side: "s", id: s.id }));
    }
    for (const e of this.battle.enemies) {
      const v = makeVisual(this, "enemies", e.def.id, true);
      this.enemyViews.set(e.uid, this.unitView(v, sizeOf(ASSETS.enemies[e.def.id]), { side: "e", uid: e.uid }));
    }
    this.layoutUnits(false);

    this.uiLayer = this.add.container(0, 0).setDepth(20);
    this.handLayer = this.add.container(0, 0).setDepth(30);
    this.tooltip = this.add.container(0, 0).setDepth(200).setVisible(false);
    this.hint = txt(this, W / 2, 520, "", 16, "#ffe9a8", { stroke: "#000", strokeThickness: 4 }).setOrigin(0.5).setDepth(40);
    this.add.rectangle(10, 52, 420, 118, 0x000000, 0.35).setOrigin(0, 0).setDepth(19);
    this.logText = txt(this, 18, 58, "", 12, "#d8d2ea", { lineSpacing: 2 }).setDepth(19);

    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.cancelSelect();
    });
    this.input.keyboard?.on("keydown-ESC", () => this.cancelSelect());
    this.input.keyboard?.on("keydown-E", () => this.endTurn());

    this.animate(this.battle.drain(), () => {});
    this.refresh();
  }

  // ───────────────────────── 배치 ─────────────────────────

  private unitView(visual: Visual, size: number, ref: Ref): UnitView {
    const root = this.add.container(0, 0);
    root.add(visual.root);
    const hud = this.add.container(0, 0);
    root.add(hud);
    const zone = this.add.rectangle(0, 0, Math.max(110, size * 1.1), Math.max(130, size * 1.3), 0xffffff, 0.001);
    zone.setInteractive({ useHandCursor: true });
    zone.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!p.rightButtonDown()) this.clickUnit(ref);
    });
    zone.on("pointerover", () => this.showTooltip(ref));
    zone.on("pointerout", () => this.tooltip.setVisible(false));
    root.add(zone);
    return { root, visual, hud, zone, size };
  }

  private spiritPos(id: string) {
    if (id === this.battle.frontId) return { x: 480, y: 330 };
    const back = this.battle.spirits.filter((s) => s.id !== this.battle.frontId);
    const i = back.findIndex((s) => s.id === id);
    return { x: 260, y: i === 0 ? 245 : 415 };
  }

  private enemyPos(i: number, n: number) {
    if (n === 1) return { x: 940, y: 330 };
    if (n === 2) return { x: 830 + i * 230, y: 330 };
    return { x: 760 + i * 180, y: i === 1 ? 300 : 360 };
  }

  private layoutUnits(tween: boolean) {
    for (const s of this.battle.spirits) {
      const v = this.spiritViews.get(s.id)!;
      const p = this.spiritPos(s.id);
      if (tween && (v.root.x !== p.x || v.root.y !== p.y)) this.tweens.add({ targets: v.root, x: p.x, y: p.y, duration: 250 });
      else v.root.setPosition(p.x, p.y);
    }
    this.battle.enemies.forEach((e, i) => {
      const p = this.enemyPos(i, this.battle.enemies.length);
      this.enemyViews.get(e.uid)!.root.setPosition(p.x, p.y);
    });
  }

  // ───────────────────────── 그리기 ─────────────────────────

  private refresh() {
    const b = this.battle;
    this.layoutUnits(true);
    for (const s of b.spirits) this.drawSpiritHud(s);
    for (const e of b.enemies) this.drawEnemyHud(e);
    this.drawUi();
    this.drawHand();
    this.logText.setText(this.logLines.slice(-7).join("\n"));
  }

  private drawSpiritHud(s: BSpirit) {
    const v = this.spiritViews.get(s.id)!;
    const h = v.hud;
    h.removeAll(true);
    const b = this.battle;
    const half = v.size / 2;
    v.visual.root.setAlpha(s.downed ? 0.3 : 1);
    if (s.awaken > 0) {
      const ring = this.add.ellipse(0, 0, v.size * 1.6, v.size * 1.5, ELEMENT_COLOR[s.def.element], 0.18).setStrokeStyle(3, 0xffffff, 0.6);
      h.add(ring);
      this.tweens.add({ targets: ring, scale: 1.08, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
    }
    if (s.id === b.frontId && !s.downed) h.add(txt(this, 0, -half - 30, "앞열", 13, COLORS.gold, { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));
    if (s.taunt) h.add(txt(this, 0, -half - 48, "도발", 13, "#9fd8ff", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));
    const pers = s.personality ? s.personality.name : "???";
    h.add(txt(this, 0, half + 12, `${s.def.name} · ${pers}`, 15, "#fff", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));
    if (s.downed) {
      h.add(txt(this, 0, half + 36, "기절 (카드 봉인)", 15, "#ff8a8a").setOrigin(0.5));
      return;
    }
    h.add(bar(this, -65, half + 34, 130, 16, s.hp / s.maxHp, COLORS.hp, `${s.hp}/${s.maxHp}`));
    if (s.block > 0) {
      h.add(this.add.rectangle(-82, half + 34, 30, 20, COLORS.block).setStrokeStyle(2, 0xffffff));
      h.add(txt(this, -82, half + 34, `${s.block}`, 13, "#fff").setOrigin(0.5));
    }
    const awakenLeft = Math.min(s.awaken, C.awaken_duration);
    h.add(bar(this, -65, half + 50, 130, 9, s.awaken > 0 ? 1 : s.sync / 100, s.awaken > 0 ? 0xffd166 : COLORS.sync));
    h.add(txt(this, 70, half + 50, s.awaken > 0 ? `각성 ${awakenLeft}턴` : `${Math.floor(s.sync)}%`, 11, s.awaken > 0 ? COLORS.gold : "#d6b8ff").setOrigin(0, 0.5));
    const st: string[] = [];
    if (s.status.burn) st.push(`화상${s.status.burn}`);
    if (s.status.weak) st.push(`약화${s.status.weak}`);
    if (s.status.vuln) st.push(`취약${s.status.vuln}`);
    if (s.thorns) st.push(`반격${s.thorns}`);
    if (s.empower) st.push(`강화+${s.empower}`);
    for (const [a] of s.auras) st.push(`지속:${cardDef(a).name}`);
    if (st.length) h.add(txt(this, 0, half + 68, st.join(" "), 12, "#ffcf9a", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));
  }

  private drawEnemyHud(e: BEnemy) {
    const v = this.enemyViews.get(e.uid)!;
    const h = v.hud;
    h.removeAll(true);
    if (e.dead) {
      v.zone.disableInteractive();
      return;
    }
    const b = this.battle;
    const half = v.size / 2;
    const it = b.intent(e);
    const iy = -half - 46;
    const box = this.add.rectangle(0, iy, 196, 40, INTENT_COLOR[it.kind] ?? 0x555555, 0.92).setStrokeStyle(2, it.kind === "chargeReady" ? 0xffe066 : 0xffffff, 0.7);
    h.add(box);
    if (it.kind === "chargeReady") this.tweens.add({ targets: box, alpha: 0.55, duration: 350, yoyo: true, repeat: -1 });
    const icon = { attack: "⚔", defend: "🛡", debuff: "☠", buff: "▲", charge: "⚡", chargeReady: "⚡", skip: "✕" }[it.kind];
    h.add(txt(this, 0, iy - 9, `${icon} ${it.name}`, 13, "#fff").setOrigin(0.5));
    h.add(txt(this, 0, iy + 9, it.text, 11, "#fff", { wordWrap: { width: 190 } }).setOrigin(0.5));

    const weakBy = Object.entries(C.affinity_beats as Record<string, string>).find(([, d]) => d === e.def.element)?.[0] as Element | undefined;
    h.add(txt(this, 0, half + 12, `${e.def.name}`, 15, "#fff", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));
    h.add(this.add.circle(-72, half + 12, 7, ELEMENT_COLOR[e.def.element]).setStrokeStyle(1, 0xffffff));
    h.add(bar(this, -65, half + 34, 130, 16, e.hp / e.maxHp, COLORS.hp, `${e.hp}/${e.maxHp}`));
    if (e.block > 0) {
      h.add(this.add.rectangle(-82, half + 34, 30, 20, COLORS.block).setStrokeStyle(2, 0xffffff));
      h.add(txt(this, -82, half + 34, `${e.block}`, 13, "#fff").setOrigin(0.5));
    }
    if (e.maxShield > 0) {
      if (e.broken) {
        h.add(txt(this, 0, half + 54, "BREAK!", 15, "#ffe066", { stroke: "#000", strokeThickness: 4, fontStyle: "bold" }).setOrigin(0.5));
      } else {
        const n = e.maxShield;
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * 15;
          const on = i < e.shield;
          h.add(this.add.rectangle(x, half + 54, 10, 10, on ? COLORS.shield : 0x444444).setAngle(45).setStrokeStyle(1, 0x000000));
        }
        h.add(txt(this, n * 7.5 + 8, half + 54, weakBy ? `약점 ${ELEMENT_NAME[weakBy]}` : "", 11, "#ffe9a8").setOrigin(0, 0.5));
      }
    } else {
      h.add(txt(this, 0, half + 54, "실드 없음", 11, COLORS.dim).setOrigin(0.5));
    }
    const st: string[] = [];
    if (e.status.burn) st.push(`화상${e.status.burn}`);
    if (e.status.chill) st.push(`냉기${e.status.chill}/${b.chillThreshold(e)}`);
    if (e.status.weak) st.push(`약화${e.status.weak}`);
    if (e.status.vuln) st.push(`취약${e.status.vuln}(+${Math.round(e.status.vulnPct * 100)}%)`);
    if (e.bonusDmg) st.push(`피해+${e.bonusDmg}`);
    if (e.phase === 2) st.push("2페이즈");
    if (st.length) h.add(txt(this, 0, half + 72, st.join(" "), 12, "#ffcf9a", { stroke: "#000", strokeThickness: 3 }).setOrigin(0.5));

    const targetable = this.selected && cardDef(this.selected.cardId).target === "enemy";
    if (targetable) {
      const ring = this.add.ellipse(0, 0, v.size * 1.3, v.size * 1.3).setStrokeStyle(3, 0xffe066, 0.9);
      h.add(ring);
    }
  }

  private drawUi() {
    const b = this.battle;
    const run = getRun();
    const u = this.uiLayer;
    u.removeAll(true);
    u.add(this.add.rectangle(0, 0, W, 44, 0x0e0c15, 0.9).setOrigin(0, 0));
    const floor = run.current ? (run.current.type === "boss" ? "보스" : `${run.current.floor}층`) : "";
    u.add(txt(this, 16, 22, `1막 · ${floor} · ${KIND_NAME[this.kind]}   ${b.turn}턴`, 17).setOrigin(0, 0.5));
    u.add(txt(this, 330, 22, `골드 ${run.gold}`, 17, COLORS.gold).setOrigin(0, 0.5));
    u.add(txt(this, W - 16, 22, "카드 클릭 → 대상 클릭 · 우클릭/ESC 취소 · E 턴 종료", 13, COLORS.dim).setOrigin(1, 0.5));

    u.add(this.add.circle(80, 590, 40, 0x2b2350).setStrokeStyle(4, 0xb9a6ff));
    u.add(txt(this, 80, 590, `${b.mana}/${C.mana_per_turn}`, 24, "#fff").setOrigin(0.5));
    u.add(txt(this, 80, 640, "마력", 13, COLORS.dim).setOrigin(0.5));
    const pile = (x: number, label: string, cards: BCard[], title: string) => {
      const btn = button(this, x, 690, 110, 34, `${label} ${cards.length}`, () => {
        this.scene.launch("DeckScene", { mode: "view", from: this.scene.key, title, cards });
        this.scene.pause();
      }, { size: 14, color: 0x3f3758 });
      u.add(btn);
    };
    pile(70, "덱", b.draw, "뽑을 덱 (순서는 섞여 있어요)");
    pile(1090, "버림", b.discard, "버린 카드");
    pile(1210, "소멸", [...b.exhaust, ...b.sealed], "소멸·봉인된 카드");
    u.add(button(this, 1170, 600, 170, 56, "턴 종료", () => this.endTurn(), {
      size: 20, color: 0xb0522e, disabled: this.busy || b.result !== "ongoing",
    }));
  }

  private drawHand() {
    const b = this.battle;
    this.handLayer.removeAll(true);
    const n = b.hand.length;
    const spacing = Math.min(138, 760 / Math.max(1, n));
    const scale = 0.92;
    b.hand.forEach((c, i) => {
      const owner = b.spirit(c.owner);
      const stats = {
        power: b.stat(owner, "power"), guard: b.stat(owner, "guard"), focus: b.stat(owner, "focus"),
        empower: owner.empower, grow: c.grow,
      };
      const ok = b.canPlay(c);
      const note = c.locked ? "봉인됨" : owner.downed ? "기절" : undefined;
      const v = cardView(this, c.cardId, c.owner, stats, { cost: b.cardCost(c), disabled: !ok.ok, note, copy: c.isCopy });
      const x = W / 2 + (i - (n - 1) / 2) * spacing;
      const sel = this.selected?.uid === c.uid;
      const y = sel ? 560 : 638;
      v.setPosition(x, y).setScale(sel ? 1.05 : scale);
      if (sel) v.add(this.add.rectangle(0, 0, CARD_W + 8, CARD_H + 8).setStrokeStyle(4, 0xffe066));
      this.handLayer.add(v);
      const bg = v.list[0] as Phaser.GameObjects.Rectangle;
      bg.setInteractive({ useHandCursor: ok.ok });
      bg.on("pointerover", () => {
        if (this.selected?.uid === c.uid) return;
        this.handLayer.bringToTop(v);
        this.tweens.add({ targets: v, y: 600, scale: 1.08, duration: 90 });
      });
      bg.on("pointerout", () => {
        if (this.selected?.uid === c.uid) return;
        this.tweens.add({ targets: v, y, scale, duration: 90 });
      });
      bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
        if (!p.rightButtonDown()) this.clickCard(c);
      });
    });
  }

  private showTooltip(ref: Ref) {
    const b = this.battle;
    const lines: string[] = [];
    let x = 0, y = 0;
    if (ref.side === "s") {
      const s = b.spirit(ref.id);
      const v = this.spiritViews.get(s.id)!;
      x = v.root.x + 90;
      y = v.root.y - 120;
      lines.push(`${s.def.name}  (${ELEMENT_NAME[s.def.element]} · ${ROLE_NAME[s.def.role]})`);
      lines.push(`파워 ${b.stat(s, "power").toFixed(1)}  가드 ${b.stat(s, "guard").toFixed(1)}  포커스 ${b.stat(s, "focus").toFixed(1)}  싱크 ${b.stat(s, "sync").toFixed(1)}`);
      lines.push(`치명 확률 ${Math.round((C.crit_base + s.critPity) * 100)}% (안 터질 때마다 +2%p)`);
      lines.push(s.personality ? `성격 ${s.personality.name}: ${s.personality.desc}` : "성격 ??? (성체가 되면 공개)");
      lines.push(`각성 ${s.def.awaken.name}: ${s.def.awaken.desc}`);
    } else {
      const e = b.enemy(ref.uid);
      if (e.dead) return;
      const v = this.enemyViews.get(e.uid)!;
      x = v.root.x - 330;
      y = v.root.y - 140;
      const weakBy = Object.entries(C.affinity_beats as Record<string, string>).find(([, d]) => d === e.def.element)?.[0] as Element | undefined;
      lines.push(`${e.def.name}  (${ELEMENT_NAME[e.def.element]} · ${{ normal: "일반", elite: "엘리트", boss: "보스", minion: "소환수" }[e.def.tier]})`);
      lines.push(weakBy ? `약점 ${ELEMENT_NAME[weakBy]} ×${C.affinity_weak}, 타격마다 실드 -1` : "약점 없음 (실드 없음)");
      lines.push(`실드 ${e.shield}/${e.maxShield} · 빙결까지 냉기 ${b.chillThreshold(e)}`);
      const pat = e.phase === 2 && e.def.phase2 ? e.def.phase2.pattern : e.def.pattern;
      lines.push("패턴: " + pat.map((m, i) => `${i === e.patternIdx % pat.length ? "▶" : ""}${m.charge ? "[차징]" : ""}${m.name}`).join(" → "));
      if (e.def.phase2 && e.phase === 1) lines.push(`HP ${e.def.phase2.hpBelow * 100}% 아래에서 2페이즈`);
    }
    this.tooltip.removeAll(true);
    const t = txt(this, 10, 8, lines.join("\n"), 13, "#fff", { wordWrap: { width: 310 }, lineSpacing: 3 });
    const bg = this.add.rectangle(0, 0, 330, t.height + 16, 0x0e0c15, 0.94).setOrigin(0, 0).setStrokeStyle(1, 0x8a80a8);
    this.tooltip.add([bg, t]);
    this.tooltip.setPosition(Phaser.Math.Clamp(x, 8, W - 340), Phaser.Math.Clamp(y, 50, H - t.height - 30)).setVisible(true);
  }

  // ───────────────────────── 입력 ─────────────────────────

  private clickCard(c: BCard) {
    if (this.busy) return;
    const b = this.battle;
    if (this.selected?.uid === c.uid) return this.cancelSelect();
    const ok = b.canPlay(c);
    if (!ok.ok) return toast(this, ok.why ?? "쓸 수 없어요", "#ff8a8a");
    const need = b.needsTarget(c);
    if (!need) return this.playCard(c);
    this.selected = c;
    this.hint.setText(need === "enemy" ? "대상 적을 클릭하세요" : "대상 정령을 클릭하세요");
    this.refresh();
  }

  private clickUnit(ref: Ref) {
    const c = this.selected;
    if (!c || this.busy) return;
    const need = this.battle.needsTarget(c);
    if (need === "enemy" && ref.side === "e") this.playCard(c, ref);
    else if (need === "ally" && ref.side === "s" && !this.battle.spirit(ref.id).downed) this.playCard(c, ref);
  }

  private cancelSelect() {
    if (!this.selected) return;
    this.selected = null;
    this.hint.setText("");
    this.refresh();
  }

  private playCard(c: BCard, target?: Ref) {
    this.selected = null;
    this.hint.setText("");
    this.battle.play(c.uid, target);
    const evts = this.battle.drain();
    this.refresh();
    this.animate(evts, () => this.afterAction());
  }

  private endTurn() {
    if (this.busy || this.battle.result !== "ongoing") return;
    this.cancelSelect();
    this.busy = true;
    this.handLayer.removeAll(true);
    this.battle.endTurn();
    const evts = this.battle.drain();
    this.drawUi();
    this.animate(evts, () => {
      this.busy = false;
      this.refresh();
      this.afterAction();
    });
  }

  private afterAction() {
    const b = this.battle;
    if (b.result === "ongoing" || this.finished) return;
    this.finished = true;
    const run = getRun();
    for (const s of b.spirits) run.spirit(s.id).hp = s.downed ? C.downed_return_hp : s.hp;
    if (b.result === "defeat") {
      this.banner("모두 쓰러졌어요…", 0x5a2020);
      this.time.delayedCall(1400, () => this.scene.start("EndScene", { victory: false }));
      return;
    }
    this.banner("승리!", 0x2d5a2d);
    this.time.delayedCall(1100, () => {
      if (this.kind === "boss") {
        run.bossDefeated = true;
        this.scene.start("EndScene", { victory: true });
        return;
      }
      const weights = this.kind === "elite" ? C.reward.rarity_elite : C.reward.rarity_normal;
      this.scene.start("RewardScene", {
        title: this.kind === "elite" ? "정예 처치 보상" : "전투 보상",
        gold: run.goldReward(this.kind),
        cardIds: run.rollCards(3, weights).map((x) => x.id),
      });
    });
  }

  // ───────────────────────── 연출 ─────────────────────────

  private refPos(ref: Ref) {
    const v = ref.side === "s" ? this.spiritViews.get(ref.id) : this.enemyViews.get(ref.uid);
    return v ? { x: v.root.x, y: v.root.y - v.size * 0.3 } : { x: W / 2, y: H / 2 };
  }

  private float(ref: Ref, text: string, color: string, size = 22) {
    const p = this.refPos(ref);
    const t = txt(this, p.x + Phaser.Math.Between(-20, 20), p.y, text, size, color, { stroke: "#000", strokeThickness: 5, fontStyle: "bold" })
      .setOrigin(0.5).setDepth(150);
    this.tweens.add({ targets: t, y: p.y - 60, alpha: 0, duration: 900, ease: "Quad.Out", onComplete: () => t.destroy() });
  }

  private banner(text: string, color: number, sub?: string) {
    const c = this.add.container(-W, H / 2 - 40).setDepth(180);
    c.add(this.add.rectangle(W / 2, 0, W, sub ? 130 : 100, color, 0.92));
    c.add(txt(this, W / 2, sub ? -18 : 0, text, 42, "#fff", { fontStyle: "bold", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5));
    if (sub) c.add(txt(this, W / 2, 34, sub, 17, "#fff").setOrigin(0.5));
    this.tweens.add({
      targets: c, x: 0, duration: 220, ease: "Quad.Out",
      onComplete: () => this.tweens.add({ targets: c, alpha: 0, delay: 750, duration: 250, onComplete: () => c.destroy() }),
    });
  }

  /** 엔진 이벤트를 시간 순서대로 연출해요. */
  private animate(evts: BattleEvent[], done: () => void) {
    let t = 0;
    const at = (dt: number, fn: () => void) => {
      t += dt;
      this.time.delayedCall(t, fn);
    };
    for (const e of evts) {
      switch (e.k) {
        case "log":
          this.logLines.push(e.text);
          break;
        case "spiritAct":
          at(0, () => this.spiritViews.get(e.id)?.visual.play("attack"));
          break;
        case "enemyAct":
          at(420, () => {
            this.enemyViews.get(e.uid)?.visual.play("attack");
            this.float({ side: "e", uid: e.uid }, e.move, "#ffffff", 18);
          });
          break;
        case "charge":
          at(420, () => this.float({ side: "e", uid: e.uid }, `⚡ ${e.move} 차징`, "#ffb347", 20));
          break;
        case "cancel":
          at(420, () => this.float({ side: "e", uid: e.uid }, `${e.reason}! 행동 취소`, "#9fd8ff", 20));
          break;
        case "damage": {
          const d = e;
          at(110, () => {
            const label = d.amount === 0 && d.blocked > 0 ? `막음 ${d.blocked}` : `${d.crit ? "치명! " : ""}-${d.amount}`;
            const color = d.amount === 0 ? "#9fd8ff" : d.crit ? "#ffe066" : d.weakHit ? "#ff9a5a" : d.ref.side === "s" ? "#ff6b6b" : "#ffffff";
            this.float(d.ref, label + (d.weakHit ? " 약점" : d.resist ? " 저항" : ""), color, d.crit ? 30 : 24);
            const v = d.ref.side === "s" ? this.spiritViews.get(d.ref.id) : this.enemyViews.get(d.ref.uid);
            if (d.amount > 0) v?.visual.play("hit");
            if (d.crit) this.cameras.main.shake(120, 0.006);
          });
          break;
        }
        case "heal":
          if (e.amount > 0) at(60, () => this.float(e.ref, `+${e.amount}`, "#7dff9a"));
          break;
        case "block":
          at(40, () => this.float(e.ref, `방어 +${e.amount}`, "#8fc8ff", 18));
          break;
        case "status":
          at(40, () => this.float(e.ref, e.text, "#e0b0ff", 17));
          break;
        case "break":
          at(80, () => {
            this.float({ side: "e", uid: e.uid }, "BREAK!", "#ffe066", 36);
            this.cameras.main.shake(180, 0.01);
          });
          break;
        case "freeze":
          at(80, () => this.float({ side: "e", uid: e.uid }, "빙결!", "#9fe8ff", 32));
          break;
        case "phase2":
          at(300, () => this.banner("그림바크 2페이즈", 0x4a2a1a, "실드 8칸으로 다시 차요. 대지 가르기를 끊을 다단 공격을 아껴두세요."));
          t += 900;
          break;
        case "awaken": {
          const s = this.battle.spirit(e.id);
          at(200, () => {
            this.cameras.main.flash(250, 255, 255, 255);
            this.banner(`✦ ${s.def.awaken.name} ✦`, ELEMENT_COLOR[s.def.element], `${s.def.name} 각성 · ${s.def.awaken.desc}`);
          });
          t += 900;
          break;
        }
        case "awakenEnd":
          at(60, () => this.float({ side: "s", id: e.id }, "각성 종료", "#cccccc", 16));
          break;
        case "downed":
          at(150, () => {
            this.spiritViews.get(e.id)?.visual.play("death");
            this.float({ side: "s", id: e.id }, "기절!", "#ff6b6b", 28);
          });
          break;
        case "enemyDead":
          at(150, () => {
            const v = this.enemyViews.get(e.uid);
            if (v) this.tweens.add({ targets: v.visual.root, alpha: 0, y: 30, duration: 450 });
          });
          break;
      }
    }
    this.logText?.setText(this.logLines.slice(-7).join("\n"));
    this.time.delayedCall(t + 160, done);
  }
}
