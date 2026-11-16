// 출전 준비 값 (0076 14 · 0078 J1): 가진 정령이 같은 크기 자리 칸으로 나란하고 앞열 하나, 위에 오늘 센 기운.
import type { EquipVM, StatId } from "../run/viewmodel";
import type { SpiritArt } from "../spiritArt";

export interface SeatVM {
  id: string;
  name: string;
  level: number;
  /** 속성 · 역할 기호 id */
  element: string;
  role: string;
  stats: Record<StatId, number>;
  slots: (EquipVM | null)[];
  /** 아직 안 본 새 카드 이름 (칩) */
  newCard?: string;
  art?: SpiritArt;
}

export interface DepartVM {
  /** 오늘 센 기운: 기호와 이름(호버) */
  strong: { icon: string; name: string };
  seats: SeatVM[];
  /** 기본 앞열 (지난 판의 앞열) */
  front: string;
}
