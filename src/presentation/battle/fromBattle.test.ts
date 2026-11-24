// 전투 화면 VM: core 전투 상태 → 화면 값
import { describe, expect, it } from "vitest";
import type { Battle, CardOutcome, Planned } from "../../core/battle";
import { ENCOUNTERS } from "../../core/data";
import { Run } from "../../core/run";
import { BattleSession } from "../../session/battle";
import { battleVM, cardUid } from "./fromBattle";

const run = () => new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"] });
const enemies = () => run().pickEncounter("battle").enemies;

describe("전투 화면 VM", () => {
  it("아군 · 적 · 손패가 전투 상태와 맞아요", () => {
    const s = new BattleSession(run(), enemies());
    const b = s.battle;
    const vm = battleVM(b);
    expect(vm.allies.map((a) => a.face)).toEqual(b.spirits.map((x) => x.id));
    expect(vm.allies.find((a) => a.front)?.face).toBe(b.frontId);
    expect(vm.enemies).toHaveLength(b.aliveEnemies().length);
    const keys = vm.hand.flatMap((g) => g.cards.map((c) => cardUid(c.key)));
    expect(keys.sort()).toEqual(b.hand.map((c) => c.uid).sort());
    expect(vm.mana.n).toBe(b.mana);
    // 낼 수 있는 카드만 plays에 있어요
    for (const c of b.hand) expect(!!vm.plays[`c${c.uid}`]).toBe(b.canPlay(c).ok);
  });

  it("받을 피해 미리보기는 실제로 맞는 값과 같아요: 카드를 놓지 않았을 때와 놓았을 때 (무작위 대상 · 치명 제외)", () => {
    const bad: string[] = [];
    for (const placed of [false, true]) {
      for (const enc of ENCOUNTERS) {
        const b = new BattleSession(run(), enc.enemies).battle;
        for (let turn = 1; turn <= 6 && b.result === "ongoing"; turn++) {
          if (placed) placeAll(b, turn);
          // 적이 무작위로 고르는 대상은 누가 맞을지 몰라요
          const random = b.aliveEnemies().some((e) => b.moveQueue(e).some((q) => q.move.actions.some((a) => "target" in a && a.target === "random")));
          const vm = battleVM(b);
          const real = playTurn(b);
          if (random) continue;
          for (const a of vm.allies) {
            const at = `${enc.id} ${turn}턴 ${a.face}${placed ? " (카드 놓음)" : ""}`;
            if ((a.incoming ?? 0) !== (real.hit[a.face] ?? 0)) bad.push(`${at}: 받을 피해 ${a.incoming ?? 0}, 실제 ${real.hit[a.face] ?? 0}`);
            if (!real.downedBefore.includes(a.face) && (a.loss ?? 0) !== (real.lost[a.face] ?? 0)) bad.push(`${at}: 깎일 HP ${a.loss ?? 0}, 실제 ${real.lost[a.face] ?? 0}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("놓은 카드가 받을 피해를 바꿔요: 방어는 깎일 HP를 줄이고, 적을 쓰러뜨리면 그 공격이 사라져요", () => {
    const b = new BattleSession(run(), ["moss_slime"]).battle;
    const front = () => battleVM(b).allies.find((a) => a.front)!;
    // 적이 앞열을 때리는 턴까지 넘겨요
    for (let i = 0; i < 4 && !front().incoming; i++) playTurn(b);
    const before = front();
    expect(before.incoming).toBeGreaterThan(0);
    // 방어도를 놓으면 받을 피해(막기 전)는 그대로고 깎일 HP만 줄어요
    const guard = b.hand.find((c) => c.owner === b.frontId && b.cardDefOf(c).effects.some((op) => op.op === "block" || op.op === "wall"));
    if (guard) {
      b.play(guard.uid, b.needsTarget(guard) === "ally" ? { side: "s", id: b.frontId } : undefined);
      expect(front().incoming).toBe(before.incoming);
      expect(front().loss).toBeLessThan(before.loss!);
    }
    // 적이 움직이기 전에 쓰러지면 받을 피해가 없어요
    b.enemies[0].hp = 1;
    const hit = b.hand.find((c) => b.canPlay(c).ok && b.cardDefOf(c).target === "enemy" && b.cardDefOf(c).effects.some((op) => op.op === "damage") && b.previewEnd(c) <= b.slots[0].at);
    expect(hit).toBeDefined();
    b.play(hit!.uid);
    expect(front().incoming).toBeUndefined();
    expect(front().loss).toBe(0);
    // 미리 돌려 봐도 전투는 그대로예요
    expect(b.enemies[0].dead).toBe(false);
    expect(b.planned.length).toBeGreaterThan(0);
  });

  it("적 HP 막대의 깎일 구간은 놓은 카드를 실제로 재생한 값과 같아요 (무작위 대상 · 치명 제외, 0168)", () => {
    const bad: string[] = [];
    let seen = 0;
    for (const enc of ENCOUNTERS) {
      const b = new BattleSession(run(), enc.enemies).battle;
      for (let turn = 1; turn <= 6 && b.result === "ongoing"; turn++) {
        placeAll(b, turn);
        const random = b.planned.some((p) => p.card && b.cardDefOf(p.card).effects.some((op) => op.op === "randomHits"));
        const alive = b.aliveEnemies();
        const vm = battleVM(b);
        const real = playTurn(b);
        if (random) continue;
        alive.forEach((e, i) => {
          const shown = vm.enemies[i].loss ?? 0;
          if (shown > 0) seen++;
          if (shown !== (real.foe[e.uid] ?? 0)) bad.push(`${enc.id} ${turn}턴 ${e.def.id}: 깎일 HP ${shown}, 실제 ${real.foe[e.uid] ?? 0}`);
        });
      }
    }
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(20);
  });

  it("차징 중인 적의 `브레이크 가능`은 브레이크 카드가 있는 파티에만 떠요 (0168)", () => {
    const lines = (party: string[]) => {
      const b = new BattleSession(new Run({ seed: 7, frontId: party[0], adult: false, unlockAll: false, party }), ["moss_slime"]).battle;
      b.enemies[0].charging = true;
      const vm = battleVM(b);
      return [...vm.enemies[0].tip!.lines.slice(1).map((l) => l.map((x) => x.text).join("")), ...vm.order.slots.flatMap((x) => x.tip?.chips?.map((c) => c.text) ?? [])];
    };
    expect(lines(["fire_fox", "mist_cat", "glass_salamander"])).not.toContain("브레이크 가능");
    expect(lines(["magma_ibex", "mist_cat", "glass_salamander"]).filter((t) => t === "브레이크 가능").length).toBeGreaterThan(0);
  });

  it("해방을 놓은 뒤 같은 턴에 놓는 카드의 숫자는 실제 타격과 같아요", () => {
    const r = run();
    r.spirit("fire_fox").stage = "awakened";
    const b = new BattleSession(r, ["moss_slime"]).battle;
    const fox = b.spirit("fire_fox");
    // 한 번 때리는 피해 카드
    const card = b.hand.find((c) => c.owner === fox.id && b.cardDefOf(c).target === "enemy"
      && b.cardDefOf(c).effects.filter((op) => op.op === "damage" && (op.hits ?? 1) === 1 && !op.hitsPerStar).length === 1);
    expect(card).toBeDefined();
    const shown = () => battleVM(b).hand.find((g) => g.owner === fox.id)!.cards.find((c) => c.key === `c${card!.uid}`)!.values[0].n;
    const plain = shown();
    expect(b.release(fox.id)).toBe(true);
    const boosted = shown();
    expect(boosted).toBeGreaterThan(plain);
    // 적의 속성 · 상태가 끼지 않게 맞추고, 치명 없이 실제로 때려 봐요
    const e = b.enemies[0];
    e.def = { ...e.def, element: "none" };
    e.status = {};
    e.block = 0;
    e.hp = e.maxHp = 999;
    b.slots.forEach((x) => (x.at = 3900));
    b.play(card!.uid);
    // 이미 놓은 카드의 풀이(순서표)도 같은 값이에요
    const tip = (battleVM(b).order.bundles ?? []).flat().find((t) => t?.tip?.title === b.cardDefOf(card!).name)?.tip;
    expect(tip?.text?.map((x) => x.text).join("")).toContain(`${boosted}`);
    b.rng.next = () => 1 - Number.EPSILON;
    b.endTurn();
    const dealt = b.drain().find((ev) => ev.k === "damage" && ev.ref.side === "e");
    expect(dealt && dealt.k === "damage" && !dealt.opening && dealt.amount + dealt.blocked).toBe(boosted);
  });
});

describe("조준 결과 미리보기 (0123)", () => {
  it("조준한 대상의 결과와 받을 피해 a→b는 그 카드를 놓고 실제로 재생한 값과 같아요 (무작위 대상 · 치명 제외)", () => {
    const bad: string[] = [];
    let compared = 0;
    for (const enc of ENCOUNTERS) {
      const b = new BattleSession(run(), enc.enemies).battle;
      for (let turn = 1; turn <= 6 && b.result === "ongoing"; turn++) {
        // 턴마다 다른 카드 · 다른 대상을 골라 앞에 몇 장을 놓은 뒤 한 장을 조준해요
        for (let n = 0; n < turn % 3; n++) placeOne(b, turn + n);
        const vm = battleVM(b);
        const c = b.hand.filter((x) => b.canPlay(x).ok)[turn % Math.max(1, b.hand.length)] ?? b.hand.find((x) => b.canPlay(x).ok);
        if (!c) { playTurn(b); continue; }
        const play = vm.plays[`c${c.uid}`];
        const alive = b.aliveEnemies();
        const i = play.target.kind !== "pick" ? "all" : play.target.side === "enemy"
          ? alive.findIndex((_, k) => !play.target.not?.includes(k) && k >= turn % alive.length) : b.spirits.findIndex((x) => !x.downed);
        const want = play.outcomes?.[i === -1 ? 0 : i];
        if (!want) { playTurn(b); continue; }
        const target = i === "all" ? undefined : play.target.side === "enemy" ? { side: "e" as const, uid: alive[i === -1 ? 0 : i].uid } : { side: "s" as const, id: b.spirits[i].id };
        const random = alive.some((e) => b.moveQueue(e).some((q) => q.move.actions.some((a) => "target" in a && a.target === "random")));
        const uids = alive.map((e) => e.uid);
        const faces = vm.allies.map((a) => a.face);
        const rest = Object.fromEntries(vm.allies.map((a) => [a.face, a.incoming ?? 0]));
        expect(b.play(c.uid, target)).toBe(true);
        const real = playTurn(b, b.planned[b.planned.length - 1]);
        const at = `${enc.id} ${turn}턴 ${b.cardDefOf(c).name}`;
        if (play.target.kind === "random") {
          // 무작위 대상 카드는 대상 결과를 확정해 보이지 않아요
          if (Object.keys(want.enemies).length) bad.push(`${at}: 무작위 카드에 대상 결과가 있음`);
          continue;
        }
        // 적이 무작위로 고르는 행동(공격 · 약화 등)이 끼면 누가 걸릴지 몰라서 견주지 않아요
        if (random) continue;
        compared++;
        uids.forEach((uid, k) => {
          const w = want.enemies[k], r = real.card?.get(uid);
          const flat = (o?: { hits: number[]; hp: { from: number; to: number }; block?: { from: number; to: number }; cut?: boolean }) =>
            (o ? JSON.stringify([o.hits, o.hp.from, o.hp.to, o.block ? o.block.to - o.block.from : 0, !!o.cut]) : "없음");
          if (flat(w) !== flat(r)) bad.push(`${at} 적 ${k}: 미리보기 ${flat(w)}, 실제 ${flat(r)}`);
        });
        faces.forEach((face, k) => {
          const to = want.incoming[k]?.to ?? rest[face];
          if (to !== (real.hit[face] ?? 0)) bad.push(`${at} ${face}: 받을 피해 ${to}, 실제 ${real.hit[face] ?? 0}`);
          const loss = want.incoming[k]?.loss;
          if (loss !== undefined && !real.downedBefore.includes(face) && loss !== (real.lost[face] ?? 0)) bad.push(`${at} ${face}: 깎일 HP ${loss}, 실제 ${real.lost[face] ?? 0}`);
        });
      }
    }
    expect(bad).toEqual([]);
    expect(compared).toBeGreaterThan(100);
  });

  it("무작위 적을 때리는 카드: 적이 여럿이면 대상 결과가 없고, 하나면 그 적의 결과가 보여요", () => {
    const spark = (enemies: string[]) => {
      const b = new BattleSession(run(), enemies).battle;
      b.hand.push({ uid: 9000, cardId: "sparks", owner: "fire_fox", tempCostDelta: 0, locked: false, isCopy: false, grow: 0, held: false, heldFast: false });
      return battleVM(b).plays.c9000;
    };
    const many = spark(["moss_slime", "bramble_rat"]);
    expect(many.target.kind).toBe("random");
    expect(many.outcomes?.all?.enemies).toEqual({});
    const single = spark(["moss_slime"]);
    expect(single.target.kind).toBe("all");
    expect(single.outcomes?.all?.enemies[0]?.hits).toHaveLength(2);
  });
});

/** 낼 수 있는 카드 하나를 놓아요 */
function placeOne(b: Battle, k: number) {
  const ok = b.hand.filter((x) => b.canPlay(x).ok);
  const c = ok[k % Math.max(1, ok.length)];
  if (!c) return;
  const need = b.needsTarget(c);
  const foes = b.aliveEnemies(), mine = b.aliveSpirits();
  b.play(c.uid, need === "enemy" ? { side: "e", uid: foes[k % foes.length].uid } : need === "ally" ? { side: "s", id: mine[k % mine.length].id } : undefined);
}

/** 낼 수 있는 카드를 모두 놓아요. 대상은 턴마다 돌려 가며 골라요 */
function placeAll(b: Battle, turn: number) {
  for (const s of b.aliveSpirits()) if (b.canRelease(s.id)) b.release(s.id);
  for (let guard = 0; guard < 20; guard++) {
    const c = b.hand.find((x) => b.canPlay(x).ok);
    if (!c) return;
    const need = b.needsTarget(c);
    const foes = b.aliveEnemies(), mine = b.aliveSpirits();
    const target = need === "enemy" ? { side: "e" as const, uid: foes[(turn + guard) % foes.length].uid }
      : need === "ally" ? { side: "s" as const, id: mine[(turn + guard) % mine.length].id } : undefined;
    if (!b.play(c.uid, target)) return;
  }
}

/** 턴을 실제로 넘기고 아군마다 받은 피해(막기 전)와 재생으로 깎인 HP를 돌려줘요. 미리보기처럼 운은 없는 것으로 맞춰요 (치명 없음) */
function playTurn(b: Battle, watch?: Planned) {
  let card: Map<number, CardOutcome> | undefined;
  const resolve = b["resolvePlanned"].bind(b);
  b["resolvePlanned"] = (p) => {
    if (p !== watch) return resolve(p);
    // 지켜보는 카드가 재생되는 동안 적마다 생긴 일을 이벤트와 앞뒤 값으로 직접 모아요
    const before = new Map(b.enemies.map((e) => [e.uid, { hp: e.hp, block: e.block }]));
    const from = b.events.length;
    resolve(p);
    card = new Map();
    for (const e of b.enemies) {
      const was = before.get(e.uid)!;
      const evs = b.events.slice(from);
      const hits = evs.flatMap((ev) => (ev.k === "damage" && ev.ref.side === "e" && ev.ref.uid === e.uid ? [ev.amount + ev.blocked] : []));
      const cut = evs.some((ev) => ev.k === "cancel" && ev.uid === e.uid && ev.reason === "break");
      if (hits.length || cut || was.hp !== e.hp || was.block !== e.block) card.set(e.uid, { hits, hp: { from: was.hp, to: e.hp }, block: { from: was.block, to: e.block }, cut });
    }
  };
  const hit: Record<string, number> = {}, lost: Record<string, number> = {};
  const foe: Record<number, number> = {};
  const foeHp = new Map(b.enemies.map((e) => [e.uid, e.hp]));
  const hp = new Map(b.spirits.map((s) => [s.id, s.hp]));
  const downedBefore = b.spirits.filter((s) => s.downed).map((s) => s.id);
  const hurt = b.hurtSpirit.bind(b);
  b.hurtSpirit = (s, dmg, pierce, opts = {}) => {
    if (opts.attacker || opts.src === "방전") hit[s.id] = (hit[s.id] ?? 0) + dmg;
    hurt(s, dmg, pierce, opts);
  };
  const replay = b["replay"].bind(b);
  b["replay"] = () => {
    const next = b.rng.next;
    b.rng.next = () => 1 - Number.EPSILON;
    try {
      return replay();
    } finally {
      b.rng.next = next;
      for (const s of b.spirits) lost[s.id] = Math.max(0, hp.get(s.id)! - s.hp);
      for (const e of b.enemies) foe[e.uid] = Math.max(0, (foeHp.get(e.uid) ?? e.hp) - e.hp);
    }
  };
  b.endTurn();
  if (b.holdChoice) b.confirmHold([]);
  b.drain();
  b.hurtSpirit = hurt;
  b["replay"] = replay;
  b["resolvePlanned"] = resolve;
  return { hit, lost, foe, downedBefore, card };
}

describe("놓은 카드 되돌리기 (0127)", () => {
  it("되돌리면 받을 피해 · 조준 결과 · 카드 숫자 미리보기가 놓기 전 값으로 돌아와요", () => {
    let undone = 0;
    for (const enc of ENCOUNTERS) {
      const s = new BattleSession(run(), enc.enemies);
      const b = s.battle;
      for (let turn = 1; turn <= 3 && b.result === "ongoing"; turn++) {
        const shots: string[] = [];
        for (let n = 0; n < 4; n++) {
          const was = JSON.stringify(battleVM(b));
          const c = b.hand.filter((x) => b.canPlay(x).ok)[(turn + n) % Math.max(1, b.hand.filter((x) => b.canPlay(x).ok).length)];
          if (!c) break;
          const need = b.needsTarget(c), foes = b.aliveEnemies(), mine = b.aliveSpirits();
          s.dispatch({ kind: "play", uid: c.uid, target: need === "enemy" ? { side: "e", uid: foes[n % foes.length].uid } : need === "ally" ? { side: "s", id: mine[n % mine.length].id } : undefined });
          if (b.canUndo()) shots.push(was);
          else shots.length = 0;
        }
        // 마지막 토큰에만 되돌리기 표시가 있어요
        const marks = (battleVM(b).order.bundles ?? []).flat().filter((t) => t.undo);
        expect(marks.length).toBe(shots.length ? 1 : 0);
        while (shots.length) {
          s.dispatch({ kind: "undo" });
          expect(JSON.stringify(battleVM(b))).toBe(shots.pop());
          undone++;
        }
        playTurn(b);
      }
    }
    expect(undone).toBeGreaterThan(ENCOUNTERS.length);
  });
});

describe("2막 규칙 표시 (0096)", () => {
  const act2 = (enemies: string[]) => new BattleSession(new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"], acts: 2 }), enemies).battle;

  it("방전 칸은 띠 조각으로, 띠에 놓은 카드는 받을 피해에 더해요", () => {
    const b = act2(["spark_bug"]);
    const z = b.zones[0];
    const before = battleVM(b);
    expect(before.order.bands?.[0]).toMatchObject({ dmg: z.dmg, head: true, n: 0 });
    // 띠 안에서 끝나는 카드를 찾아 놓아요
    const c = b.hand.find((x) => b.canPlay(x).ok && b.previewEnd(x) >= z.from && b.previewEnd(x) < z.to);
    if (!c) return;
    const held = before.plays[`c${c.uid}`].slot?.bands ?? [];
    expect(held.reduce((n, x) => n + x.n, 0)).toBe(1);
    const owner = before.allies.findIndex((a) => a.face === c.owner);
    const need = b.needsTarget(c);
    b.play(c.uid, need === "enemy" ? { side: "e", uid: b.enemies[0].uid } : need === "ally" ? { side: "s", id: c.owner } : undefined);
    const after = battleVM(b);
    expect((after.allies[owner].incoming ?? 0) - (before.allies[owner].incoming ?? 0)).toBe(z.dmg);
  });

  it("특성 칩과 땅속: 되돌리기 · 가속은 칩, 땅속인 적은 올라오기 전 카드로 고를 수 없어요", () => {
    const b = act2(["mole", "mirror_shard", "lightning_rod"]);
    expect(battleVM(b).enemies.map((e) => e.traits?.length ?? 0)).toEqual([0, 1, 1]);
    b.endTurn();
    if (b.result !== "ongoing") return;
    const vm = battleVM(b);
    expect(vm.enemies[0].buried).toBe(true);
    const mole = b.enemies[0];
    for (const c of b.hand) {
      const play = vm.plays[`c${c.uid}`];
      if (!play || play.target.kind !== "pick" || play.target.side !== "enemy") continue;
      expect(!!play.target.not?.includes(0)).toBe(b.buriedAt(mole, b.previewEnd(c)));
    }
  });
});
