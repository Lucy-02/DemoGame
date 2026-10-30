// 정령 관리 화면 문구. 정본 R4 v5 문구 + 결정 0021의 탭·행동 이름.
// 카드 동사는 "사용"(0011), 제작 용어(기믹형·인간형)는 쓰지 않아요(0012 리뷰).
import type { Stage } from "../../core/types";
import type { TabId } from "./viewmodel";

const COPY_MATERIAL = "재료";

export const COPY = {
  garden: "정원",
  sep: "/",
  here: "정령",
  material: COPY_MATERIAL,
  owned: "보유 정령",
  sort: "얻은 순",
  deployed: "출전",
  partyEdit: "편성 바꾸기",
  close: "닫기",
  personality: "성격",
  hidden: "???",
  reroll: "다시 뽑기",
  stats: "능력치",
  legendBase: "기본",
  legendStage: "단계 보정",
  awaken: "각성",
  next: "다음 단계",
  final: "최종 단계",
  exclusive: "전용 카드",
  bond: "유대",
  todo: "할 일",
  grow: "키우기",
  level: "Lv",
  exp: "경험",
  gate: (to: string) => `${to}로`,
  levelNeed: (n: number) => `Lv ${n}`,
  feed: "먹이기",
  affinity: "호감도",
  episode: (n: number) => `이야기 ${n}`,
  seen: "봤어요",
  open: "볼 수 있어요",
  unit: "장",
  percent: "%",
  revealed: "성격 공개",
  hiddenNote: "성체가 되면 드러나요",
  newCard: "새 카드 보기",
  newEpisode: "이야기 보기",
  maxLevel: "최대 레벨",
  now: "지금",
  watch: "보기",
  cost: (n: number) => `${COPY_MATERIAL} ${n}`,
  fresh: "새로",
  freshCount: (n: number) => `새로 ${n}`,
};

export const TAB_LABEL: Record<TabId, string> = {
  overview: "개요",
  growth: "성장 길",
  bond: "유대",
};

export const STAGE_LABEL: Record<Stage, string> = {
  baby: "유체",
  adult: "성체",
  awakened: "각성체",
};

/** 자람 조건 이름 (0021 2절). 이름은 임시예요 */
export const DEED_LABEL = {
  awaken: "전투 중 각성",
  blocked: "방어도로 막은 피해",
  freeze: "빙결",
} as const;
