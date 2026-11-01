// 파일럿 3종 밖의 정령 목업 (Lucy 2026-11-02: 파일럿 3종을 먼저 만들고, 나머지도 각자 화면에서 목업으로 봐요).
// 그림·이름·속성만 있어요. 능력치·카드·각성은 아직 없어서 화면에 "?"와 "아직 정하지 않았어요"로 보여요. 전투·정원 규칙에는 들어가지 않아요.
// 이름·속성: design/canon/spirits/pool-2026-10-30.yaml (작업용 이름, 비개구리는 임시)
import type { Stage } from "../../core/types";

export interface Mockup {
  id: string;
  name: string;
  /** 속성 이름 (9속성, 아이콘이 있는 건 불·물·바람뿐이에요) */
  element: string;
}

export const MOCKUPS: readonly Mockup[] = [
  { id: "flash", name: "섬광", element: "전기" },
  { id: "kelp_seahorse", name: "해마", element: "물" },
  { id: "magma_ibex", name: "산양", element: "땅" },
  { id: "mirage", name: "신기루", element: "불" },
  { id: "mirror_peacock", name: "공작", element: "빛" },
  { id: "night_owl", name: "부엉이", element: "숲" },
  { id: "pearl_oyster", name: "진주조개", element: "빛" },
  { id: "prism_chameleon", name: "카멜레온", element: "숲" },
  { id: "rain_frog", name: "비개구리", element: "물" },
  { id: "river_otter", name: "수달", element: "물" },
  { id: "rune", name: "룬", element: "땅" },
  { id: "shadow_moth", name: "그림자 나방", element: "그림자" },
];

/** 목업을 처음 열 때 보여 줄 단계. 성장 길 탭에서 단계를 눌러 바꿔 봐요 */
export const MOCK_FIRST_STAGE: Stage = "awakened";

export const MOCK_ELEMENT_ICON: Record<string, string> = { 불: "e-fire", 물: "e-water", 바람: "e-wind" };
