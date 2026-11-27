// 깃들기 화면 값 (0076 · 0078 J1): 무대에 후보 둘, 후보마다 이름 · 속성 · 역할 기호 · 성격 칩 · 대표 카드.
import type { CardVM } from "../card/viewmodel";
import type { SpiritArt } from "../spiritArt";
import type { Crop } from "../spirits/artFit";

export interface FaceVM { id: string; key: string; crop: Crop }

/** 성격 칩과 호버 풀이. note = 성체가 되기 전이면 붙는 한 줄 */
export interface PersonalityVM { id: string; name: string; desc: string; note?: string }

export interface JoinCandVM {
  id: string;
  name: string;
  /** 속성 · 역할 기호 id */
  element: string;
  role: string;
  personality: PersonalityVM;
  /** 대표 카드 */
  card: CardVM;
  /** 본그림 (유체). 없으면 실루엣 */
  art?: SpiritArt;
  face?: FaceVM;
}

export interface JoinVM {
  cands: JoinCandVM[];
  /** 지금 가진 정령 얼굴 (그림이 없으면 null) */
  party: (FaceVM | null)[];
  /** 함께 떠나는 자리 수 */
  seats: number;
  /** 연달아 둘째 깃들기: 바로 앞에 고른 정령 얼굴 (0078 고칠 점 3) */
  prev?: FaceVM | null;
}
