import { round } from "../stats";
import type { Engine } from "./engine";
import { isEnemy, statusN, statusStrength, type BEnemy, type BSpirit, type StatusId, type StatusStack } from "./state";

/** 상태 하나의 규칙: 쌓는 법, 줄어드는 때, 끝나는 때, 어느 단계에 끼어드는지 */
export interface StatusDef {
  name: string;
  /** add: 더해요(기본). max: 켜짐 표시처럼 1을 넘지 않아요 */
  stack?: "add" | "max";
  /** 라운드 끝에 1씩 줄어요. 적 턴에 걸린 것은 그 라운드에는 줄지 않아요. 0이 되면 세기도 0 */
  countsTurns?: boolean;
  /** thisTurn: 이 턴의 라운드 끝에 사라져요. nextTurn: 다음 턴의 라운드 끝에 사라져요 */
  lasts?: "thisTurn" | "nextTurn";
  /** 아군 턴 시작에 사라져요 (turnStart 훅보다 먼저) */
  clearsAtTurnStart?: boolean;
  /** 정령이 쓰러지면 사라져요 */
  clearsWhenDowned?: boolean;
  /** 쌓일 때 상태 이벤트를 내지 않아요 */
  silent?: boolean;
  /** 쌓일 때 내는 상태 이벤트 문구 */
  gainText: (added: number, total: number) => string;
  /** 쌓인 직후 */
  onGain?: (b: Engine, h: BSpirit | BEnemy, st: StatusStack) => void;
  /** 턴 시작, 방어도와 턴 값이 지워진 뒤 */
  turnStart?: (b: Engine, h: BSpirit | BEnemy, st: StatusStack) => void;
  /** 턴 끝 처리. 아군 전부 → 적 전부, 같은 쪽 안에서는 표 순서 */
  turnEnd?: (b: Engine, h: BSpirit | BEnemy, st: StatusStack) => void;
  /** 이 상태를 가진 아군이 적의 공격 1타에 맞은 뒤 (벽이 대신 받았을 때도) */
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
      else b.hurtSpirit(h, st.n, true, { src: "화상" });
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
  /** 적의 공격 기본값에 더해요 */
  bonusDmg: { name: "피해", gainText: (n) => `피해 +${n}` },
  /** 다음 타격 n번에 세기만큼 더해요 */
  hitBonus: { name: "타격 보너스", gainText: (n, total) => `다음 타격 ${total}번 강화` },

  /** 적에게 새긴 별. 낙하 카드가 세어요 */
  star: { name: "별", gainText: (_n, total) => `별 ${total}` },
  /** 다음 타격 n번이 맞힌 적에게 별을 새겨요 */
  starlight: { name: "별빛", gainText: (n, total) => `별빛 ${total}` },
  /** 다음 턴 시작에 수치만큼 피해를 받아요 (혜성) */
  comet: {
    name: "혜성",
    gainText: (n) => `혜성 ${n}`,
    turnStart(b, h, st) {
      if (!isEnemy(h)) return;
      b.log(`${h.def.name}: 혜성 낙하`);
      b.hurtEnemy(h, st.n, false);
      delete h.status.comet;
    },
  },

  /** 벽: 이 정령의 방어도가 다른 아군을 대신 받아요 */
  wall: { name: "벽", stack: "max", silent: true, gainText: () => "벽" },
  /** 이번 턴 다음에 얻는 벽에 더해요 */
  wallHeat: { name: "달군 유리", clearsAtTurnStart: true, gainText: (n) => `다음 벽 +${n}` },
  /** 이번 턴 벽이 깨졌어요 */
  wallBroken: { name: "벽 깨짐", stack: "max", clearsAtTurnStart: true, silent: true, gainText: () => "벽 깨짐" },
  /** 이 적의 공격을 이번 턴 벽이 막은 양 */
  wallTaken: { name: "벽이 막음", clearsAtTurnStart: true, silent: true, gainText: () => "" },
  /** 턴 끝에 벽이 깨져 있었으면 남아서, 다음 턴 시작에 수치만큼 벽을 얻어요 */
  afterglow: {
    name: "잔열",
    clearsWhenDowned: true,
    gainText: (n) => `잔열 ${n}`,
    turnEnd(_b, h) {
      if (statusN(h, "wallBroken") === 0) delete h.status.afterglow;
    },
    turnStart(b, h, st) {
      delete h.status.afterglow;
      if (isEnemy(h)) return;
      b.log(`${h.def.name}: 잔열`);
      b.gainWall(h, st.n);
    },
  },

  /** 아군 타격 n번이 허점타로 들어가요. 다음 턴 끝까지 */
  stagger: { name: "휘청", lasts: "nextTurn", gainText: (_n, total) => `휘청 ${total}` },
  /** 다음 행동이 없어져요 */
  cancelNext: { name: "행동 취소", stack: "max", gainText: () => "다음 행동 취소" },
  /** 이 정령의 다음 카드 시간에서 빼요 (ms) */
  footing: { name: "디딤", clearsAtTurnStart: true, gainText: (n) => `다음 카드 -${n}ms` },

  /** 다음 적 공격을 끌어와 절반만 받아요. 공격을 하나 받거나 턴이 끝나면 풀려요 */
  hidden: { name: "숨음", stack: "max", lasts: "thisTurn", clearsWhenDowned: true, gainText: () => "숨음" },
  /** 받아칠 기회: 다음 카드 효과 × ready_mult. 다음 턴 끝까지 */
  ready: { name: "받아칠 기회", lasts: "nextTurn", clearsWhenDowned: true, gainText: (_n, total) => `받아칠 기회 ${total}` },
};

/** 라운드 끝: 턴을 세는 상태가 줄고, 기한이 찬 상태가 사라져요 */
export function tickStatuses(h: BSpirit | BEnemy, turn: number) {
  for (const id of Object.keys(h.status) as StatusId[]) {
    const st = h.status[id]!;
    if (st.until !== undefined && turn >= st.until) {
      delete h.status[id];
      continue;
    }
    if (!STATUSES[id].countsTurns) continue;
    if (st.n > 0 && !st.fresh) st.n--;
    if (st.n === 0) st.strength = 0;
    st.fresh = false;
  }
}

export function clearStatuses(h: BSpirit | BEnemy, when: "clearsAtTurnStart" | "clearsWhenDowned") {
  for (const id of Object.keys(h.status) as StatusId[]) if (STATUSES[id][when]) delete h.status[id];
}
