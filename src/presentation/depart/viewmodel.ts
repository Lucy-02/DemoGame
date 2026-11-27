// 출전 준비 값 (0076 14 · 0078 J1): 가진 정령이 같은 크기 자리 칸으로 나란하고 앞열 하나, 위에 오늘 센 기운.
import type { PersonalityVM } from "../join/viewmodel";
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
  /** 이번 판의 성격 (칩). 판이 끝날 때 새로 정해진 것이에요 */
  personality: PersonalityVM;
  /** 완주로 연 성격 가운데 지금 성격이 아닌 것 (0157 · 0171). 있으면 칩을 눌러 바꿔 떠나요 */
  opened: PersonalityVM[];
  art?: SpiritArt;
}

export interface DepartVM {
  /** 오늘 센 기운: 기호와 이름(호버) */
  strong: { icon: string; name: string };
  seats: SeatVM[];
  /** 기본 앞열 (지난 판의 앞열) */
  front: string;
}
