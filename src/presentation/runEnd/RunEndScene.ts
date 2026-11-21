// 판 결과 (0046 런 결과 · 정리안 f1~f3, 0076 17번 낱말). 오른쪽 정령 세 줄은 같은 부품, 왼쪽에 기록 한 줄 · 첫 판 안내 · "이번 판에서만" 점선 상자 · 버튼 둘.
// 줄은 이번 판으로 달라진 것만 보여요(0050: 라벨 없이 부품으로): Lv 오름 배지, 경험 링 before→after, 다음 판 최대 HP a→b, 열린 카드 칩.
// 이번 판에서만 남는 것(골드 · 배운 카드)은 점선 상자에 가볍게, 판이 닫히면 사라져요(골드 a→0).
// 버튼 둘은 세 경우 모두 같은 자리, 강조(밝은 유리 판)만 바뀌어요: 이기면 정원으로, 지면 다시 떠나기.
// 왼쪽 열 기준선은 오른쪽 세 줄에 맞춰요: 기록 윗선 = 첫 줄 윗선, 버튼 아랫선 = 마지막 줄 아랫선.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import type { RunRecord } from "../../session/game";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { drawBackdrop } from "../run/backdrop";
import { preloadStage } from "../stage";
import { cardWithFace } from "../run/cards";
import { COPY as RUN_COPY } from "../run/copy";
import { LANE_ICONS, drawLane } from "../run/lanes";
import { RUN_END } from "../run/layout";
import { P, button, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box } from "../style/draw";
import { ms } from "../style/ease";
import { render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { revealInOrder } from "../style/motion";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { COPY } from "./copy";
import { runEndRecord } from "./fixtures";
import { runEndVM } from "./fromRecord";
import type { RunEndVM } from "./viewmodel";

export const RUN_END_SCENE = "runEnd";

const T = tokens.provisional.text.runScreen;
const TR = tokens.provisional.text.result;
const R = RUN_END;
const THUMB_SCALE = R.thumb.w / HAND_CARD.w;

export interface RunEndSceneData {
  record?: RunRecord;
  /** 고정 장면 이름 (fixtures RUN_ENDS). record를 주면 무시해요 */
  scene?: string;
  onGarden?: (scene: Phaser.Scene) => void;
  onAgain?: (scene: Phaser.Scene) => void;
}

export class RunEndScene extends Phaser.Scene {
  private vm!: RunEndVM;
  private data_?: RunEndSceneData;
  private act = 1;

  constructor() {
    super(RUN_END_SCENE);
  }

  init(data: RunEndSceneData) {
    this.data_ = data;
    const record = data.record ?? runEndRecord(data.scene);
    this.act = record.run.act;
    this.vm = runEndVM(record);
  }

  preload() {
    for (const [id, w] of [...LANE_ICONS, ["i-coin", R.only.icon]] as const) loadIcon(this, id, w);
    for (const c of this.vm.cards) preloadHandCard(this, c.card, { showRarity: true, scale: THUMB_SCALE });
    preloadSpiritArt(this, this.vm.lanes.map((l) => l.id));
    preloadStage(this, this.act);
  }

  create() {
    const vm = this.vm;
    drawBackdrop(this, this.act);
    // 덩어리마다 모아 두고, 다 그린 뒤 차례로 나타나요 (0086): 기록 → 남는 것 → 이번 판에서만 → 정령 줄 → 버튼
    const parts: Phaser.GameObjects.Container[] = [];
    const part = (draw: () => void) => parts.push(gather(this, 0, 0, draw));
    const lanes = vm.lanes.map((l, i) => gather(this, 0, 0, () => { drawLane(this, l, i, { noSocket: true, maxOnly: true }); }));

    let y = R.top;
    const record = text(vm.record, T.record, P.ink3Spirit, { lh: R.recordLh });
    part(() => { render(this, record, R.x, y); });
    y += size(record).h + R.gap;
    part(() => this.drawOnly(y));
    parts.push(...lanes);

    // 버튼 둘: 같은 자리, 강조만 바뀌어요
    const B = R.button;
    const node: Node = {
      t: "row", gap: B.gap,
      children: [
        button(COPY.garden, { size: TR.button, h: B.h, w: B.w, radius: B.radius, plate: vm.victory, onClick: () => this.data_?.onGarden?.(this) }),
        button(COPY.again, { size: TR.button, h: B.h, w: B.w, radius: B.radius, plate: !vm.victory, onClick: () => this.data_?.onAgain?.(this) }),
      ],
    };
    part(() => { render(this, node, R.x, B.y); });
    revealInOrder(this, parts, ms(tokens.provisional.motion.screen.out.duration));
    Object.assign(window, { __screenReady: RUN_END_SCENE });
  }

  /** 이번 판에서만 남는 것: 내용을 감싸는 점선 상자. 동전 옆에 골드 a→0, 그 아래 배운 카드 썸네일(왼쪽 정렬) */
  private drawOnly(top: number) {
    const O = R.only, vm = this.vm;
    const gold: Node = {
      t: "row", h: O.rowH, gap: O.iconGap, align: "center",
      children: [
        { t: "icon", id: "i-coin", w: O.icon, h: O.icon, tint: P.gold },
        { t: "row", gap: 0, align: "baseline", children: [text(`${vm.gold}${RUN_COPY.arrow}`, T.onlyWas, P.ink3Spirit), text("0", T.onlyNum, P.ink, { lh: 1 })] },
      ],
    };
    // 배운 카드: 한 줄로 늘어서고, 왼쪽 열 폭을 넘으면 겹쳐요
    const n = vm.cards.length;
    const maxInner = R.w - O.pad[1] - O.pad[3];
    const step = Math.min(R.thumb.w + R.thumb.gap, n > 1 ? (maxInner - R.thumb.w) / (n - 1) : 0);
    const thumbH = HAND_CARD.h * THUMB_SCALE;
    const thumbsW = n ? R.thumb.w + (n - 1) * step : 0;
    const rows: Node[] = [gold, ...(n ? [{ t: "row", w: thumbsW, h: thumbH, children: [] } as Node] : [])];
    const node: Node = { t: "col", pad: O.pad, gap: O.gap, children: rows };
    const { w, h } = size(node);
    const g = this.add.graphics();
    box(g, R.x, top, w, h, O.radius, { ring: { width: O.ring, color: withAlpha(P.ink, O.lineAlpha), dash: O.dash } });
    render(this, node, R.x, top);
    const left = R.x + O.pad[3];
    const rowY = top + O.pad[0] + O.rowH + O.gap;
    vm.cards.forEach((c, i) => {
      const x = left + i * step;
      createHandCard(this, cardWithFace(this, c.card, vm.lanes.find((l) => l.id === c.owner), THUMB_SCALE), x + (R.thumb.w - HAND_CARD.w) / 2, rowY + thumbH - HAND_CARD.h, { showRarity: true, scale: THUMB_SCALE });
    });
  }
}
