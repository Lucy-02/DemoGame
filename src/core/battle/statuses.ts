import { round } from "../stats";
import type { Engine } from "./engine";
import { isEnemy, statusN, statusStrength, type BEnemy, type BSpirit, type StatusId, type StatusStack } from "./state";

/** 상태 하나의 규칙: 쌓는 법, 줄어드는 때, 끝나는 때, 어느 단계에 끼어드는지 */
export interface StatusDef {
  name: string;
  /** 라운드 끝에 1씩 줄어요. 적 턴에 걸린 것은 그 라운드에는 줄지 않아요. 0이 되면 세기도 0 */
  countsTurns?: boolean;
  /** 아군 턴 시작에 사라져요 */
  clearsAtTurnStart?: boolean;
  /** 정령이 쓰러지면 사라져요 */
  clearsWhenDowned?: boolean;
  /** 쌓일 때 내는 상태 이벤트 문구 */
  gainText: (added: number, total: number) => string;
  /** 쌓인 직후 */
  onGain?: (b: Engine, h: BSpirit | BEnemy, st: StatusStack) => void;
  /** 턴 끝 처리. 아군 전부 → 적 전부, 같은 쪽 안에서는 표 순서 */
  turnEnd?: (b: Engine, h: BSpirit | BEnemy, st: StatusStack) => void;
  /** 이 상태를 가진 아군이 적의 공격 1타에 맞은 뒤 */
  afterAttacked?: (b: Engine, s: BSpirit, attacker: BEnemy, st: StatusStack) => void;
}

/** 취약 배율 */
export const vulnMult = (h: BSpirit | BEnemy) => (statusN(h, "vuln") > 0 ? 1 + statusStrength(h, "vuln") : 1);

export const STATUSES: Record<StatusId, StatusDef> = {
  /** 턴 끝에 수치만큼 피해를 주고 절반으로 줄어요 (0040). 적은 취약 배율이 붙어요. */
  burn: {
    name: "화상",
    clearsWhenDowned: true,
    gainText: (n) => `화상 ${n}`,
    turnEnd(b, h, st) {
      if (isEnemy(h)) b.hurtEnemy(h, round(st.n * vulnMult(h)), true);
      else b.hurtSpirit(h, st.n, true, "화상");
      st.n = Math.floor(st.n / 2);
    },
  },
  /** 문턱에 차면 0이 되고 빙결해요 */
  chill: {
    name: "냉기",
    clearsWhenDowned: true,
    gainText: (n) => `냉기 ${n}`,
    onGain(b, h, st) {
      if (!isEnemy(h) || st.n < b.chillThreshold(h)) return;
      st.n = 0;
      b.freezeEnemy(h);
    },
  },
  /** 턴 끝에 수치만큼 회복하고 1 줄어요 */
  regen: {
    name: "재생",
    clearsWhenDowned: true,
    gainText: (n) => `재생 ${n}`,
    turnEnd(b, h, st) {
      if (isEnemy(h) || h.downed) return;
      b.healSpirit(h, st.n);
      st.n--;
    },
  },
  /** 받는 피해 × (1 + 세기) */
  vuln: { name: "취약", countsTurns: true, clearsWhenDowned: true, gainText: (n) => `취약 ${n}` },
  /** 주는 피해 × weak_mult */
  weak: { name: "약화", countsTurns: true, clearsWhenDowned: true, gainText: (n) => `약화 ${n}` },
  /** 적의 공격에 맞으면 수치만큼 되돌려요 (취약 배율 적용) */
  thorns: {
    name: "반격",
    clearsAtTurnStart: true,
    gainText: (_n, total) => `반격 ${total}`,
    afterAttacked(b, s, e, st) {
      if (e.dead) return;
      b.log(`${s.def.name}: 반격`);
      b.hurtEnemy(e, round(st.n * vulnMult(e)), false);
    },
  },
  /** 적의 단일 공격을 받아요 */
  taunt: { name: "도발", clearsAtTurnStart: true, gainText: () => "도발" },
  /** 이번 턴 타격의 기본값에 더해요 */
  empower: { name: "강화", clearsAtTurnStart: true, gainText: (n) => `강화 +${n}` },
  /** 이번 전투 동안 방어도가 턴 시작에 사라지지 않아요 */
  keepBlock: { name: "방어도 유지", gainText: () => "방어도 유지" },
  /** 적의 공격 기본값에 더해요 */
  bonusDmg: { name: "피해", gainText: (n) => `피해 +${n}` },
};

/** 라운드 끝: 턴을 세는 상태가 줄어요 */
export function tickStatuses(h: BSpirit | BEnemy) {
  for (const id of Object.keys(h.status) as StatusId[]) {
    const st = h.status[id]!;
    if (!STATUSES[id].countsTurns) continue;
    if (st.n > 0 && !st.fresh) st.n--;
    if (st.n === 0) st.strength = 0;
    st.fresh = false;
  }
}

export function clearStatuses(h: BSpirit | BEnemy, when: "clearsAtTurnStart" | "clearsWhenDowned") {
  for (const id of Object.keys(h.status) as StatusId[]) if (STATUSES[id][when]) delete h.status[id];
}
