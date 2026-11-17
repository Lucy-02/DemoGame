// 휴식 세션: 쉬기(모든 정령 최대 HP의 일부 회복) 또는 카드 강화 중 꼭 하나를 골라요 (0046 Lucy 2026-11-10 답).
// 둘 다 할 것이 없을 때(모두 HP가 가득하고 강화할 카드도 없음)만 그냥 떠날 수 있어요. 회복량은 constants.json rest_heal_pct.
import { C } from "../core/data";
import type { Run } from "../core/run";

export type RestCommand =
  | { kind: "rest" }
  /** 덱 카드 한 장 강화 (0080) */
  | { kind: "upgrade"; uid: number };

export class RestSession {
  private _done = false;

  constructor(readonly run: Run) {}

  /** 쉬기나 강화를 마쳤어요 */
  get done(): boolean {
    return this._done;
  }

  /** 쉬면 정령마다 HP가 얼마나 차는지 (규칙을 한 번 돌려 보고 되돌려요) */
  healPreview(): Record<string, number> {
    const before = this.run.spirits.map((s) => s.hp);
    this.run.healAllPct(C.rest_heal_pct);
    const gain = Object.fromEntries(this.run.spirits.map((s, i) => [s.id, s.hp - before[i]]));
    this.run.spirits.forEach((s, i) => { s.hp = before[i]; });
    return gain;
  }

  canRest(): boolean {
    return !this._done && Object.values(this.healPreview()).some((n) => n > 0);
  }

  /** 강화할 수 있는 덱 카드 uid */
  upgradable(): number[] {
    return this._done ? [] : this.run.deck.filter((c) => this.run.canUpgrade(c.uid)).map((c) => c.uid);
  }

  canUpgrade(): boolean {
    return this.upgradable().length > 0;
  }

  /** 할 것이 하나도 없을 때만 그냥 떠나요 */
  canLeaveEmpty(): boolean {
    return !this._done && !this.canRest() && !this.canUpgrade();
  }

  /** 명령을 적용했으면 true */
  dispatch(cmd: RestCommand): boolean {
    if (this._done) return false;
    if (cmd.kind === "rest") {
      if (!this.canRest()) return false;
      this.run.healAllPct(C.rest_heal_pct);
    } else {
      if (!this.run.canUpgrade(cmd.uid)) return false;
      this.run.upgradeCard(cmd.uid);
    }
    this._done = true;
    return true;
  }
}
