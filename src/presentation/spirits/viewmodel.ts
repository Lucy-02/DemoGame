// 정령 관리 화면이 그리는 데이터. 화면은 이것만 보고 그려요 (정원 상태 → fromGarden.ts → 이 모양).
import type { Stage } from "../../core/types";
import type { IconId } from "../faces";
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

/** 개요 탭 능력치 한 줄: 기본 + 단계 + 성격 */
export interface StatRowVM {
  label: string;
  base: number;
  stage: number;
  personality: number;
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
  art?: { key: string; frame?: Frame; fit: Fit };
  stage: string;
  /** 목업은 레벨이 없어요 */
  level?: number;
  final: boolean;
  /** 파일럿 3종 밖의 목업 (능력치·카드·각성이 아직 없어요) */
  mock?: boolean;
  /** 기호 없는 꼬리표도 있어요 (목업) */
  tags: { icon?: IconId; text: string }[];
  /** 유체면 undefined (???) */
  personality?: string;
  stats: StatVM[];
  tabs: TabVM[];
  facts: FactVM[];
  overview: {
    rows: StatRowVM[];
    awaken: { name: string; desc: string };
    /** 성격 설명 (유체는 숨김) */
    personality?: { name: string; desc: string };
    reroll: { can: boolean; cost: number; shown: boolean };
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
