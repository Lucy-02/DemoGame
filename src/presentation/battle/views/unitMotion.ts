// 턴 재생 중 유닛 반응 (0086). 장면(재생 한 걸음)마다 그 걸음에 일어난 일(ActedVM)을 한 번 보여 줘요.
// 그림만 움직이고 정보 묶음은 제자리예요. 모든 움직임은 한 걸음(motion.playback.step) 안에 끝나고, 화면은 흔들지 않아요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { ms } from "../../style/ease";
import { FAST, MOVE, reducedMotion } from "../../style/motion";
import { opacityOf } from "../../style/opacity";
import type { ActedVM, BattleVM, UnitRef } from "../viewmodel";
import { drawPops, drawTrail, drawUnitInfo, popAt, type UnitView } from "./units";

const H = tokens.provisional.motion.hit;

export interface UnitActor {
  ref: UnitRef;
  view: UnitView;
  /** 유닛 한 덩어리 (그림 · 그림자 · 정보 묶음 · 의도) */
  root: Phaser.GameObjects.Container;
}

const same = (a: UnitRef, b?: UnitRef) => !!b && a.side === b.side && a.i === b.i;
/** 상대 쪽 방향: 아군은 오른쪽, 적은 왼쪽 */
const toward = (ref: UnitRef) => (ref.side === "ally" ? 1 : -1);

/**
 * 이 장면에서 일어난 일을 보여 줘요. layer = 알약 · 잔상을 올릴 층 (필드 맨 위).
 * - 행동한 유닛: 상대 쪽으로 한 번 나섰다 돌아와요 (순서표 토큰 짚기와 같은 때)
 * - 맞은 유닛: 나섬이 가장 깊을 때 밀렸다 돌아오고, 머리 위에 타격 알약이 떴다 흐려져요. HP 막대의 깎인 구간은 잠깐 남았다가 줄어들어요
 * - HP 숫자 · 막대 · 방어도는 맞는 때에 바뀌어요: 그때까지는 바뀌기 전 값의 묶음을 덮어 그려 둬요 (밀림 · 알약 · 잔상과 같은 때)
 * - 회복 · 방어도: 알약만 떠요
 * - 쓰러짐: 적은 한 덩어리로 흐려져 사라지고, 아군은 그림이 흐려진 채 남아요
 * 앞 걸음에 이미 쓰러진 적은 그리지 않아요.
 */
export function playUnitMotion(scene: Phaser.Scene, vm: BattleVM, units: UnitActor[], layer: Phaser.GameObjects.Container) {
  const acted: ActedVM | undefined = vm.acted;
  const still = reducedMotion();
  const hitAt = ms(H.recoil.delay);
  for (const u of units) {
    const unit = u.ref.side === "ally" ? vm.allies[u.ref.i] : vm.enemies[u.ref.i];
    const pops = acted?.pops.filter((p) => same(u.ref, p.ref)) ?? [];
    const lost = pops.reduce((a, p) => a + (p.kind === "damage" ? p.n : 0), 0);
    if (u.ref.side === "enemy" && unit.hp <= 0 && !lost) {
      // 재생이 끝나 화면에서 빠질 때까지 자리는 비워 둬요
      u.root.setVisible(false);
      continue;
    }
    if (!acted) continue;
    const art = u.view.art;
    const was = acted.was?.find((w) => same(u.ref, w.ref));
    if (was && (was.hp !== unit.hp || was.block !== unit.block)) {
      const old = drawUnitInfo(scene, u.ref.side, { ...unit, hp: was.hp, block: was.block }, u.ref.i);
      u.root.add(old);
      u.view.info.setVisible(false);
      scene.time.delayedCall(hitAt, () => {
        old.destroy();
        u.view.info.setVisible(true);
      });
    }
    if (same(u.ref, acted.actor) && !still) {
      const d = H.lunge.distance * toward(u.ref);
      scene.tweens.addCounter({ from: 0, to: 1, duration: ms(H.lunge.duration), ease: "Sine.easeInOut", onUpdate: (t) => { art.x = d * Math.sin(Math.PI * (t.getValue() ?? 1)); } });
    }
    if (lost && !still) {
      const d = -H.recoil.distance * toward(u.ref), all = ms(H.recoil.duration);
      scene.tweens.chain({
        targets: art, delay: hitAt,
        tweens: [
          { x: d, duration: all / 4, ease: FAST.ease },
          { x: 0, duration: (all * 3) / 4, ease: MOVE.ease },
        ],
      });
    }
    if (lost) {
      const healed = pops.reduce((a, p) => a + (p.kind === "heal" ? p.n : 0), 0);
      const trail = drawTrail(scene, u.ref.side, u.ref.i, unit.maxHp, Math.min(unit.maxHp, unit.hp + lost - healed), unit.hp);
      if (trail) {
        layer.add(trail);
        const w = trail.width;
        // 잔상은 맞는 때에 나타나 줄어들어요
        trail.setVisible(false);
        scene.tweens.addCounter({
          from: 1, to: 0, delay: hitAt, duration: ms(H.trail.duration), ease: MOVE.ease,
          onStart: () => trail.setVisible(true),
          onUpdate: (t) => trail.setCrop(0, 0, w * (t.getValue() ?? 0), trail.height),
          onComplete: () => trail.destroy(),
        });
      }
      if (unit.hp <= 0) {
        const d = ms(H.down.duration);
        if (u.ref.side === "enemy") {
          const fade = opacityOf(u.root);
          scene.tweens.addCounter({ from: 1, to: 0, delay: hitAt + ms(H.pill.hold) - d / 2, duration: d, ease: FAST.ease, onUpdate: (t) => { fade.value = t.getValue() ?? 0; } });
        } else {
          art.setAlpha(1);
          scene.tweens.add({ targets: art, alpha: H.down.alpha, delay: hitAt, duration: d, ease: FAST.ease });
        }
      }
    }
    if (!pops.length) continue;
    const at = popAt(u.ref.side, u.ref.i);
    for (const pill of drawPops(scene, pops, at.x, at.y)) {
      layer.add(pill);
      const fade = opacityOf(pill);
      fade.value = 0;
      const show = { delay: hitAt, duration: FAST.duration / 2, ease: FAST.ease };
      scene.tweens.addCounter({ from: 0, to: 1, ...show, onUpdate: (t) => { fade.value = t.getValue() ?? 1; } });
      scene.tweens.addCounter({ from: 1, to: 0, delay: hitAt + ms(H.pill.hold), duration: ms(H.pill.fade), ease: FAST.ease, onUpdate: (t) => { fade.value = t.getValue() ?? 0; } });
      if (!still) scene.tweens.add({ targets: pill, y: -H.pill.rise, delay: hitAt, duration: ms(H.pill.hold) + ms(H.pill.fade), ease: MOVE.ease });
    }
  }
}
