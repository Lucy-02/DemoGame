// 언어별 문구 표. 표마다 id → 문구 필드예요. 새 언어는 폴더를 만들고 여기에 더해요.
import koCards from "./ko/cards.json";
import enCards from "./en/cards.json";

export const LOCALES = {
  ko: { cards: koCards },
  en: { cards: enCards },
};
