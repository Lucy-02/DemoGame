// 게임 세션(진행 중인 판) → 메인 화면 VM.
// 정령 메뉴의 뱃지(0054: 키우기 · 갈래 고르기 · 새 카드)는 판 밖에서 할 일이 없어져서 지금은 안 떠요 (0157: 성장은 판 안에서).
import type { Run } from "../../core/run";
import { spiritArt } from "../spiritArt";
import { COPY } from "./copy";
import type { HomePrimaryVM, HomeVM } from "./viewmodel";

export function homeVM(run?: Run, version?: string): HomeVM {
  return {
    version: version && COPY.version(version),
    title: COPY.title,
    primary: run ? continueVM(run) : { kind: "depart", label: COPY.depart },
    // 도감 · 설정 화면은 아직 없어요. 도감은 생기면 넣고, 설정은 자리만 있어요
    items: [{ id: "spirits", label: COPY.spirits }, { id: "glossary", label: COPY.glossary, icon: "g-book" }, { id: "settings", label: COPY.settings, icon: "i-gear" }, { id: "quit", label: COPY.quit }],
  };
}

function continueVM(run: Run): HomePrimaryVM {
  const ids = run.spirits.map((s) => s.id);
  const faces = run.spirits.map((s) => {
    const a = spiritArt(s.id, s.stage);
    return a?.crop && { key: a.body, crop: a.crop };
  });
  // 지도에서 아직 칸에 들어가지 않았으면 1층이에요. 보스 칸은 마지막 층 다음
  const floor = run.current ? Math.min(run.current.floor, run.floors + 1) : 1;
  return { kind: "continue", label: COPY.continue, floor: COPY.floor(floor), faces, ids };
}
