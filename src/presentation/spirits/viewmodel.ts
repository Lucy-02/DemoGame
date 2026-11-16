// 정령 관리 화면이 그리는 데이터. 화면은 이것만 보고 그려요 (정원 상태 → fromGarden.ts → 이 모양).
import type { Stage } from "../../core/types";
import type { IconId } from "../faces";
import type { EquipTipVM, EquipVM } from "../run/viewmodel";
import type { Crop, Fit, Frame } from "./artFit";

export type TabId = "overview" | "growth" | "bond";

/** 띠 타일의 링 (0021 6절): 진행 중 / 키우기 가능 / 최종 단계 */
export interface RingVM {
  kind: "progress" | "ready" | "final";
  /** 0~1 */
  value: number;
}

export interface TileVM {
  id: string;
  name: string;
  element: IconId;
  /** 단계 칩: "유체 Lv2" */
  chip: string;
  ring: RingVM;
  /** 할 일 개수 (0이면 배지 없음) */
  todo: number;
  deployed: boolean;
  /** 원형 얼굴: 본그림 텍스처와 자를 자리 (없으면 자리표시) */
  face?: { key: string; crop: Crop };
}

export interface StatVM {
  label: string;
  /** 정하지 않은 값(목업)이면 undefined */
  value?: number;
  /** 단계로 올랐나 (▲) */
  up: boolean;
}

export interface TabVM {
  id: TabId;
  label: string;
  /** 탭 옆 숫자 ("Lv4", "1/3") */
  count?: string;
  /** 할 일 배지 기호 (없으면 배지 없음) */
  badge?: IconId;
}

export type FactVM =
  | { kind: "next"; label: string; percent?: number; final?: string; ready?: boolean }
  | { kind: "cells"; label: string; have: number; total: number; fresh: number }
  | { kind: "bond"; label: string; have: number; total: number }
  /** 할 일이 있을 때만 (장부 §3-2 C). 버튼은 그 탭을 열어요 (타일 → 탭 → 행동) */
  | { kind: "todo"; label: string; action: string; tab: TabId; badge: IconId };

/** 개요 탭 능력치 한 줄: 기본 + 단계 + 성격 + 장비 */
export interface StatRowVM {
  label: string;
  base: number;
  stage: number;
  personality: number;
  /** 남긴 장비가 더하거나 깎는 몫 (0066: 어디서 온 값인지는 여기서만 쪼개요) */
  equip: number;
  total: number;
}

export interface UnlockChipVM {
  name: string;
  /** 이 정령 손 기준 숫자 요약 ("피해 10") */
  detail: string;
  open: boolean;
  /** 열렸는데 아직 안 봄 (할 일) */
  fresh: boolean;
}

export interface GrowthRowVM {
  stage: string;
  state: "done" | "now" | "next";
  /** 목업: 누르면 이 단계 그림을 보여 줘요 */
  pick?: Stage;
  /** 이 단계에서 여는 레벨 줄 ("Lv2", "Lv3"…) */
  chips: (UnlockChipVM & { at: string })[];
  /** 성체 줄의 성격 공개 등 덧붙임 */
  notes: string[];
}

export interface GateVM {
  to: string;
  level: { need: number; ok: boolean };
  deed?: { label: string; have: number; need: number; ok: boolean };
  ready: boolean;
}

export interface EpisodeVM {
  n: number;
  state: "seen" | "open" | "locked";
  /** 잠겼으면 무엇이 더 필요한지 */
  need?: string;
}

export interface SpiritDetailVM {
  id: string;
  name: string;
  /** 지금 단계 본그림 (없으면 자리표시) */
  art?: { key: string; frame?: Frame; fit: Fit; puppet?: string };
  stage: string;
  /** 목업은 레벨이 없어요 */
  level?: number;
  final: boolean;
  /** 파일럿 3종 밖의 목업 (능력치·카드·해방이 아직 없어요) */
  mock?: boolean;
  /** 기호 없는 꼬리표도 있어요 (목업) */
  tags: { icon?: IconId; text: string }[];
  /** 정해지지 않은 목업이면 undefined (???) */
  personality?: string;
  stats: StatVM[];
  /** 남긴 장비 칸 (0056 · 0066). 빈 칸은 null. 목업은 칸이 없어요 */
  equip: ({ item: EquipVM; tip: EquipTipVM } | null)[];
  tabs: TabVM[];
  facts: FactVM[];
  overview: {
    rows: StatRowVM[];
    release: { name: string; desc: string };
    /** 성격 설명. note: 유체 때 덧붙이는 안내. 목업은 없어요 */
    personality?: { name: string; desc: string; note?: string };
  };
  growth: {
    /** 목업은 레벨이 없어요 */
    level?: number;
    exp?: { have: number; need: number };
    rows: GrowthRowVM[];
    gate?: GateVM;
  };
  bond: {
    affinity: number;
    next?: number;
    episodes: EpisodeVM[];
    feed: { gain: number; cost: number; can: boolean };
  };
}

export interface SpiritsVM {
  material: number;
  roster: TileVM[];
  deployed: number;
  partySize: number;
  selected: string;
  detail: SpiritDetailVM;
}

/** 갈래 고르기 창 (0047 S15 · 라운드 G1) */
export interface BranchPickVM {
  spiritId: string;
  name: string;
  level: string;
  element: IconId;
  role: IconId;
  personality: string;
  face?: { key: string; crop: Crop };
  /** 부른 곳 (정원 / 런 결과) */
  from: "garden" | "runResult";
  /** 왼쪽 "지금" 열 능력치 */
  now: { icon: IconId; color: string; value: number }[];
  branches: BranchColVM[];
  /** 고른 갈래 번호 (0부터). 열린 갈래가 없으면 undefined */
  selected?: number;
  /** 하나라도 잠긴 갈래가 있으면 조건 줄을 모든 열에 둬요 (줄 맞춤) */
  condRow: boolean;
}

export interface BranchColVM {
  id: string;
  /** 1, 2 */
  n: number;
  name: string;
  role: IconId;
  open: boolean;
  /** 키운 뒤 값과 ▲양 (안 바뀐 칸은 gain 0) */
  stats: { value: number; gain: number }[];
  /** 갈래 고유 카드 (없으면 자리 카드) */
  cards: { key?: string; name: string }[];
  /** 잠겼을 때 조건 */
  cond?: { level: { need: number; ok: boolean }; cards: { have: number; need: number } };
}
