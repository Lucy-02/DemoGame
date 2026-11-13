// 고정 장면 (?screen=home&scene=…). 저장·정원·런이 연결되기 전까지 화면 확인용이에요. 시안 프레임마다 하나.
import { spiritArt } from "../spiritArt";
import { COPY } from "./copy";
import type { HomeItemVM, HomeVM } from "./viewmodel";

const spirits = (extra: Partial<HomeItemVM> = {}): HomeItemVM => ({ id: "spirits", label: COPY.spirits, ...extra });
const codex = (extra: Partial<HomeItemVM> = {}): HomeItemVM => ({ id: "codex", label: COPY.codex, icon: "i-log", ...extra });
const settings: HomeItemVM = { id: "settings", label: COPY.settings, icon: "i-gear" };
const quit: HomeItemVM = { id: "quit", label: COPY.quit };

const face = (id: string) => {
  const a = spiritArt(id, "baby");
  return a?.crop && { key: a.body, crop: a.crop };
};
const PARTY = ["glass_salamander", "mist_cat", "fire_fox"];

export const HOMES: Record<string, HomeVM> = {
  /** 첫 판 뒤: 도감은 아직 없고, 정령 관리가 처음 열림 */
  first: {
    title: COPY.title, primary: { kind: "depart", label: COPY.depart },
    items: [spirits({ badge: { kind: "new" }, tip: { title: COPY.spirits, lines: [COPY.newSpirit(1)] } }), settings, quit],
  },
  /** 꽉 찬 상태: 할 일 넷, 도감에 새것 */
  full: {
    title: COPY.title, primary: { kind: "depart", label: COPY.depart },
    items: [
      spirits({ badge: { kind: "count", n: 4 }, tip: { title: COPY.spirits, lines: [COPY.join([COPY.grow(3), COPY.branch(1)]), COPY.join([COPY.newSpirit(1), COPY.newCard(2)])] } }),
      codex({ badge: { kind: "new" } }), settings, quit,
    ],
  },
  /** 진행 중인 판이 있음: 강조 버튼이 이어하기 */
  running: {
    title: COPY.title,
    primary: { kind: "continue", label: COPY.continue, floor: COPY.floor(5), faces: PARTY.map(face), ids: PARTY },
    items: [spirits(), codex(), settings, quit],
  },
};

export const DEFAULT_HOME = "full";
