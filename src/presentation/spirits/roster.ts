// 정령 관리 화면이 보는 정령들 (0157). 성장은 판 안에서 끝나서, 화면은 정원이 아니라 "지금 보여 줄 정령들"을 읽어요.
// 판 밖(정원)에서는 떠날 때의 모습(유체 Lv 1), 판 안에서는 그 판에서 자란 모습이에요.
import { toRunSpirit, type Garden } from "../../core/garden";
import { evolve } from "../../core/growth";
import type { Run } from "../../core/run";
import type { RunSpirit } from "../../core/types";
import type { GardenSession } from "../../session/garden";
import type { RunSession } from "../../session/run";

export interface Roster {
  spirits: readonly RunSpirit[];
  /** 정령 id → 이 판에서 받은 카드 id (갈래 조건, 0058). 판 밖이면 비어요 */
  received: Readonly<Record<string, readonly string[]>>;
}

/** 화면에 정령들을 대 주는 곳. evolve가 없으면 볼 수만 있어요 (판 밖) */
export interface SpiritsSource {
  roster(): Roster;
  onChange(f: () => void): () => void;
  /** 키우기. 갈래 고르기면 고른 갈래 id (0027) */
  evolve?(id: string, branch?: string): void;
}

export const gardenRoster = (g: Garden): Roster => ({ spirits: g.spirits.map(toRunSpirit), received: {} });

export const runRoster = (run: Run): Roster => ({
  spirits: run.spirits, received: Object.fromEntries(run.spirits.map((s) => [s.id, run.receivedBy(s.id)])),
});

/** 정원의 정령: 떠날 때의 모습으로 보기만 해요 */
export const gardenSource = (session: GardenSession): SpiritsSource => ({
  roster: () => gardenRoster(session.state),
  onChange: (f) => session.onChange(f),
});

/** 진행 중인 판의 정령: 지도 차례에 키울 수 있어요 */
export const runSource = (session: RunSession): SpiritsSource => ({
  roster: () => runRoster(session.run),
  onChange: (f) => session.onSave(f),
  evolve: (id, branch) => void session.evolve(id, branch),
});

/** 고정 정령들 (화면 확인 · 시각 검증). 키우기는 이 안에서만 바뀌어요 */
export function fixedSource(start: Roster): SpiritsSource {
  let roster = start;
  const listeners = new Set<() => void>();
  return {
    roster: () => roster,
    onChange: (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    evolve: (id, branch) => {
      roster = { ...roster, spirits: roster.spirits.map((s) => (s.id === id ? evolve(s, roster.received[s.id] ?? [], branch) : s)) };
      for (const f of listeners) f();
    },
  };
}
