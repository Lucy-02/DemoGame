// 턴 재생: 턴 종료로 확정된 이벤트를, 턴 종료 직전 화면(VM)에 차례로 입혀 장면들로 풀어요.
// 전투 규칙은 이미 끝까지 계산돼 있고, 여기서는 보여 주는 순서만 만들어요 (아키텍처 0001 3절).
import type { BattleEvent, Ref } from "../../core/battle";
import type { AllyTokenVM, BattleVM, OrderSlotVM, PopVM, UnitRef } from "./viewmodel";

/** 턴 종료 직전의 유닛 자리: VM 인덱스 → 전투의 id */
export interface PlaybackCast {
  /** allies 순서의 정령 id */
  allies: string[];
  /** enemies 순서의 적 uid */
  enemies: number[];
}

interface Frame {
  vm: BattleVM;
}

const clone = (vm: BattleVM): BattleVM => ({
  ...vm,
  order: { ...vm.order, playing: true, slots: vm.order.slots.map((s) => ({ ...s })), bundles: vm.order.bundles?.map((l) => l.map((t) => ({ ...t }))) },
  allies: vm.allies.map((a) => ({ ...a })),
  enemies: vm.enemies.map((e) => ({ ...e })),
  // 재생 중에는 카드를 낼 수 없어요
  plays: {}, playable: 0,
  acted: undefined,
});

/**
 * 이벤트를 행동(정령 카드 · 적 행동) 단위로 끊어 장면을 만들어요.
 * 첫 장면은 아무것도 지나가지 않은 재생 시작, 그 뒤로 행동 하나가 지나갈 때마다 한 장면이에요.
 */
export function playbackFrames(before: BattleVM, cast: PlaybackCast, events: readonly BattleEvent[]): BattleVM[] {
  let cur = clone(before);
  const frames: Frame[] = [];
  const push = () => { frames.push({ vm: cur }); cur = clone(cur); };
  const slotsOf = (uid: number) => {
    const i = cast.enemies.indexOf(uid);
    return cur.order.slots.filter((s) => s.enemy === i && s.state !== "past");
  };
  const drop = (gone: OrderSlotVM[]) => {
    // 빠진 행동은 표에서 빼고 번호만 다시 매겨요 (0074 12번). 그 앞 묶음은 다음 묶음에 합쳐요
    for (const s of gone) {
      const k = cur.order.slots.indexOf(s);
      if (k < 0) continue;
      cur.order.slots.splice(k, 1);
      const b = cur.order.bundles;
      if (b) b.splice(k, 2, [...(b[k] ?? []), ...(b[k + 1] ?? [])]);
    }
    cur.order.slots.forEach((s, i) => { s.n = i + 1; });
  };
  const unit = (ref: Ref) => (ref.side === "s" ? cur.allies[cast.allies.indexOf(ref.id)] : cur.enemies[cast.enemies.indexOf(ref.uid)]);
  const tokens = (): AllyTokenVM[] => (cur.order.bundles ?? []).flat();
  const refOf = (ref: Ref): UnitRef | undefined => {
    const i = ref.side === "s" ? cast.allies.indexOf(ref.id) : cast.enemies.indexOf(ref.uid);
    return i < 0 ? undefined : { side: ref.side === "s" ? "ally" : "enemy", i };
  };
  // 이 장면에서 일어난 일: 행동한 유닛과 머리 위 알약 (0086)
  const acting = (actor?: UnitRef) => { cur.acted = { actor, pops: cur.acted?.pops ?? [] }; };
  const pop = (ref: Ref, kind: PopVM["kind"], n: number) => {
    const at = refOf(ref);
    if (!at || n <= 0) return;
    cur.acted ??= { pops: [] };
    cur.acted.pops.push({ ref: at, kind, n });
  };

  push();
  let acted = false;
  for (const ev of events) {
    switch (ev.k) {
      case "spiritAct":
      case "enemyAct": {
        if (acted) push();
        acted = true;
        acting(refOf(ev.k === "spiritAct" ? { side: "s", id: ev.id } : { side: "e", uid: ev.uid }));
        if (ev.k === "spiritAct") {
          const t = tokens().find((x) => !x.past && x.face === ev.id && x.tip?.title === ev.card) ?? tokens().find((x) => !x.past && x.face === ev.id);
          if (t) t.past = true;
        } else {
          const s = slotsOf(ev.uid)[0];
          if (s) s.state = "past";
        }
        break;
      }
      case "cancel": {
        const s = slotsOf(ev.uid).find((x) => x.cut !== "done");
        if (s) { s.cut = "done"; s.charge = undefined; }
        break;
      }
      case "delay":
        if (ev.nextTurn) drop(slotsOf(ev.uid).slice(0, 1));
        break;
      case "enemyDead":
        drop(slotsOf(ev.uid));
        break;
      case "damage": {
        const u = unit(ev.ref);
        if (u) { u.hp = Math.max(0, u.hp - ev.amount); u.block = Math.max(0, (u.block ?? 0) - ev.blocked) || undefined; }
        pop(ev.ref, "damage", ev.amount);
        break;
      }
      case "heal": {
        const u = unit(ev.ref);
        if (u) u.hp = Math.min(u.maxHp, u.hp + ev.amount);
        pop(ev.ref, "heal", ev.amount);
        break;
      }
      case "block": {
        const u = unit(ev.ref);
        if (u) u.block = (u.block ?? 0) + ev.amount;
        pop(ev.ref, "block", ev.amount);
        break;
      }
      default:
    }
  }
  if (acted) push();
  // 지금 차례: 아직 지나가지 않고 끊기지 않은 첫 적 행동에 흰 테 (0074)
  for (const f of frames) {
    const next = f.vm.order.slots.find((s) => s.state !== "past" && s.cut !== "done");
    if (next) next.state = "now";
  }
  return frames.map((f) => f.vm);
}
