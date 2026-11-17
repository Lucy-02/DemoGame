// 게임 세션(정원 + 진행 중인 판) → 메인 화면 VM.
// 뱃지 숫자는 눌러서 할 행동(키우기 · 갈래 고르기), N은 처음 보는 것(새 카드)이에요 (0054). 둘 다면 숫자만.
import { isBranching, todos, type Garden } from "../../core/garden";
import type { Run } from "../../core/run";
import { spiritArt } from "../spiritArt";
import { COPY } from "./copy";
import type { HomeBadge, HomeItemVM, HomePrimaryVM, HomeVM } from "./viewmodel";

export function homeVM(garden: Garden, run?: Run): HomeVM {
  return {
    title: COPY.title,
    primary: run ? continueVM(run) : { kind: "depart", label: COPY.depart },
    // 도감 · 설정 화면은 아직 없어요. 도감은 생기면 넣고, 설정은 자리만 있어요
    items: [spiritsItem(garden), { id: "settings", label: COPY.settings, icon: "i-gear" }, { id: "quit", label: COPY.quit }],
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

function spiritsItem(garden: Garden): HomeItemVM {
  let grow = 0, branch = 0, cards = 0;
  for (const s of garden.spirits) {
    for (const t of todos(s)) {
      if (t.kind === "evolve") (isBranching(s) ? branch++ : grow++);
      if (t.kind === "unlock") cards++;
    }
  }
  const acts = grow + branch;
  const badge: HomeBadge | undefined = acts ? { kind: "count", n: acts } : cards ? { kind: "new" } : undefined;
  const lines = [
    COPY.join([...(grow ? [COPY.grow(grow)] : []), ...(branch ? [COPY.branch(branch)] : [])]),
    cards ? COPY.newCard(cards) : "",
  ].filter(Boolean);
  return { id: "spirits", label: COPY.spirits, badge, tip: lines.length ? { title: COPY.spirits, lines } : undefined };
}
