// 데모 끝 (0101): 데모 빌드에서 마지막 막의 보스를 이긴 판 결과 다음에 한 번 떠요.
// 판 결과 틀을 그대로 써요: 같은 배경, 왼쪽 열 기준선, 같은 자리의 버튼. 버튼은 판 결과에서 누른 곳으로 이어 가요.
// 위시리스트 · 피드백 링크는 자리만 점선으로 비워 뒀어요 (메인 화면의 게임 이름 자리와 같은 표시).
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { drawBackdrop } from "../run/backdrop";
import { RUN_END } from "../run/layout";
import { linkSlot } from "../run/linkSlot";
import { COPY as RUN_END_COPY } from "../runEnd/copy";
import { P, button, text } from "../spirits/views/parts";
import { ms } from "../style/ease";
import { render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { revealInOrder } from "../style/motion";
import { COPY } from "./copy";

export const DEMO_END_SCENE = "demoEnd";

const T = tokens.provisional.text.runScreen;
const TR = tokens.provisional.text.result;
const R = RUN_END;

export interface DemoEndSceneData {
  /** 판 결과에서 누른 곳: 정원으로(기본) 또는 다시 떠나기 */
  next?: "garden" | "again";
  onNext?: (scene: Phaser.Scene) => void;
}

export class DemoEndScene extends Phaser.Scene {
  private data_?: DemoEndSceneData;

  constructor() {
    super(DEMO_END_SCENE);
  }

  init(data: DemoEndSceneData) {
    this.data_ = data;
  }

  create() {
    drawBackdrop(this);
    const B = R.button;
    const parts: Phaser.GameObjects.Container[] = [];
    const part = (node: Node, y: number) => parts.push(gather(this, 0, 0, () => { render(this, node, R.x, y); }));
    const title = text(COPY.title, T.eventName, P.ink);
    part(title, R.top);
    // 링크 자리 둘: 버튼과 같은 크기의 점선 칸
    const slots: Node = { t: "row", gap: B.gap, children: COPY.slots.map(linkSlot) };
    part(slots, R.top + size(title).h + R.gap);
    const label = this.data_?.next === "again" ? RUN_END_COPY.again : RUN_END_COPY.garden;
    part(button(label, { size: TR.button, h: B.h, w: B.w, radius: B.radius, plate: true, onClick: () => this.next() }), B.y);
    revealInOrder(this, parts, ms(tokens.provisional.motion.screen.out.duration));
    Object.assign(window, { __screenReady: DEMO_END_SCENE });
  }

  /** 버튼 (봇도 이 손잡이를 눌러요) */
  next() {
    this.data_?.onNext?.(this);
  }
}
