// 전투 이벤트 → 소리. 규칙이 확정한 결과만 들려줘요 (아키텍처 0001 3절).
import type { BattleEvent } from "../../core/battle";
import type { SfxId } from "./sounds";

/**
 * 타격의 세 무게 (0087): 치명 · 약점은 무겁게, 저항했거나 방어가 절반 넘게 받아 냈으면 가볍게, 나머지는 보통.
 * 방어가 다 받아 냈으면 타격 대신 방어 소리예요.
 */
function hit(ev: Extract<BattleEvent, { k: "damage" }>): SfxId | undefined {
  if (ev.amount <= 0) return ev.blocked > 0 ? "block" : undefined;
  if (ev.crit || ev.weakHit) return "hit.heavy";
  if (ev.resist || ev.blocked > ev.amount) return "hit.light";
  return "hit.medium";
}

export function cueOf(ev: BattleEvent): SfxId | undefined {
  switch (ev.k) {
    case "damage": return hit(ev);
    case "block": return "block";
    case "status":
    case "freeze": return "status";
    case "heal": return "heal";
    case "release": return "release";
    case "downed": return "down.ally";
    case "enemyDead": return "down.enemy";
    case "charge": return "charge";
    case "cancel": return "break";
    default: return undefined;
  }
}

/** 한 번에 나는 소리 묶음: 같은 소리는 한 번만 */
export function cuesOf(events: readonly BattleEvent[]): SfxId[] {
  const out: SfxId[] = [];
  for (const ev of events) {
    const id = cueOf(ev);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * 턴 재생의 장면마다 날 소리. playbackFrames와 같은 자리에서 끊어요:
 * 첫 장면은 재생 시작(소리 없음), 그 뒤로 행동 하나가 지나갈 때마다 한 장면이에요.
 */
export function playbackCues(events: readonly BattleEvent[]): SfxId[][] {
  const groups: BattleEvent[][] = [[]];
  let acted = false;
  for (const ev of events) {
    if (ev.k === "spiritAct" || ev.k === "enemyAct") {
      if (acted) groups.push([]);
      acted = true;
    }
    groups[groups.length - 1].push(ev);
  }
  return acted ? [[], ...groups.map(cuesOf)] : [[]];
}
