// 예시: 정본 쉬는 상태의 손패에 카드 일러스트를 얹어 카드 얼굴·못 내는 카드 표시를 확인해요.
// 카드와 그림의 짝은 확인용이에요(실제 카드 데이터와 연결되면 카드 정의가 그림을 가리켜요).
import { cardArtOf } from "../../card/art";
import type { BattleVM } from "../viewmodel";
import { canonRest } from "./canonRest";

const PREVIEW: Record<string, string> = {
  meteor: "landslide", pierce: "starlight", breeze: "constellation",
  claw: "ram", blast: "glass_shatter", heat: "tail_sweep", counter: "obsidian_horn",
  zap: "glass_wall",
};

export const exampleCardArt: BattleVM = {
  ...canonRest,
  hand: canonRest.hand.map((grp) => ({
    ...grp,
    cards: grp.cards.map((c) => ({ ...c, illustration: cardArtOf(PREVIEW[c.key] ?? "") })),
  })),
};

/** 예시: 가운데 고르기 창 (0075 낙하). 고르는 카드는 큰 얼굴이에요 (0159) */
export const examplePick: BattleVM = {
  ...exampleCardArt,
  pick: { kind: "fall", n: 1, cards: exampleCardArt.hand.flatMap((g) => g.cards).filter((c) => ["pierce", "claw", "zap"].includes(c.key)).map((c) => ({ ...c, off: undefined })), picked: [] },
};
