// 전투 세션: 판의 전투 칸에서 core 전투(Battle)를 만들고, 화면이 보내는 명령(카드 사용 · 턴 종료)을 받아요.
// 화면은 Battle을 직접 고치지 않아요. 명령마다 확정된 연출 이벤트(BattleEvent)를 돌려주고, 화면은 그것을 재생해요 (아키텍처 0001 3절).
import { Battle, type BCard, type BattleEvent, type Ref } from "../core/battle";
import { Rng } from "../core/rng";
import type { Run } from "../core/run";
import { tallyDeeds, type DeedTally } from "./deeds";
import type { BattleOutcome } from "./run";

export type BattleCommand =
  /** 카드를 그 주인 줄 끝에 놓아요. 대상이 필요한 카드면 target */
  | { kind: "play"; uid: number; target?: Ref }
  | { kind: "endTurn" }
  /** 해방 카드를 그 정령에게 놓아요 (0075) */
  | { kind: "release"; id: string }
  /** 열린 낙하 고르기에서 받을 카드 */
  | { kind: "fall"; cards: string[] }
  /** 턴 끝 품기 고르기에서 품을 카드 */
  | { kind: "hold"; uids: number[] }
  /** 마지막에 놓은 카드를 되돌려요 (0074 7번) */
  | { kind: "undo" };

export class BattleSession {
  readonly battle: Battle;
  /** 싸우는 막 (배경 그림을 고를 때 써요) */
  readonly act: number;
  /** 이 전투에서 정령마다 센 자람 조건 (0021 · 0045) */
  private deeds: DeedTally = {};

  /** 판의 지금 상태로 전투를 열어요. 난수는 판의 난수에서 하나 뽑아 써요 (legacy와 같은 자리) */
  constructor(run: Run, enemies: string[]) {
    this.act = run.act;
    this.battle = new Battle(run.spirits, run.battleDeck(), enemies, run.frontId, new Rng(run.rng.int(0, 1e9)), run.enemyScale(), run.battleTraits());
    this.battle.firstGapBonus = run.battleGapBonus();
    // 품을 카드는 재생 뒤 고르기 창에서 물어요 (0075)
    this.battle.askHold = true;
    // 놓은 카드는 마지막 것부터 되돌릴 수 있어요 (0074 7번)
    this.battle.keepUndo = true;
    // 여는 동안 생긴 이벤트(전투 시작 기록 · 첫 뽑기)는 화면이 처음 그릴 때 이미 반영돼 있어요
    this.battle.drain();
  }

  get over(): boolean {
    return this.battle.result !== "ongoing";
  }

  /** 명령을 처리하고 그 사이 생긴 연출 이벤트를 돌려줘요. 받지 않은 명령이면 빈 목록 */
  dispatch(cmd: BattleCommand): BattleEvent[] {
    const b = this.battle;
    if (this.over) return [];
    switch (cmd.kind) {
      case "play":
        if (!b.play(cmd.uid, cmd.target)) return [];
        break;
      case "endTurn":
        b.endTurn();
        break;
      case "release":
        if (!b.release(cmd.id)) return [];
        break;
      case "fall":
        if (!b.chooseFall(cmd.cards)) return [];
        break;
      case "hold":
        if (!b.confirmHold(cmd.uids)) return [];
        break;
      case "undo":
        if (!b.undo()) return [];
        break;
    }
    const events = b.drain();
    tallyDeeds(this.deeds, events);
    return events;
  }

  /** 이 카드가 대상을 골라야 하는지 (적이 하나면 고르지 않아요) */
  needsTarget(c: BCard) {
    return this.battle.needsTarget(c);
  }

  /** 끝난 전투의 결과 (판 세션에 넘겨요) */
  outcome(): BattleOutcome {
    const b = this.battle;
    if (!this.over) throw new Error("전투가 아직 끝나지 않았어요");
    return { won: b.result === "victory", spirits: b.spirits.map((s) => ({ id: s.id, hp: s.hp, downed: s.downed })), deeds: this.deeds };
  }
}
