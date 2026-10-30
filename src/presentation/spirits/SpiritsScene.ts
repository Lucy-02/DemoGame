// 정령 관리 화면 (정본: 정령 관리 R4 v5, 탭 내용은 결정 0021). 정원 세션 상태 → 화면 데이터 → 그리기.
// 상태가 바뀌거나 탭·정령을 고르면 화면을 통째로 다시 그려요(정지 화면이라 충분히 가벼워요).
import * as Phaser from "phaser";
import type { Garden } from "../../core/garden";
import { GardenSession } from "../../session/garden";
import { loadIcon } from "../style/icons";
import { DEFAULT_GARDEN, GARDENS } from "./fixtures";
import { spiritsVM } from "./fromGarden";
import type { TabId } from "./viewmodel";
import { drawArt, drawBackdrop, drawScrim } from "./views/backdrop";
import { ID_ICONS, drawIdCard } from "./views/idCard";
import { PANEL_ICONS, drawPanel } from "./views/panel";
import { RAIL_ICONS, drawFacts, drawRail } from "./views/rail";
import { STRIP_ICONS, drawStrip } from "./views/strip";
import { TOP_ICONS, drawTopbar } from "./views/topbar";

export const SPIRITS_SCENE = "spirits";

export interface SpiritsSceneData {
  /** 고정 정원 이름 (fixtures GARDENS). 세션을 주면 무시해요 */
  scene?: string;
  session?: GardenSession;
  /** 처음 고를 정령, 열 탭, 패널 접힘 (시각 검증용) */
  select?: string;
  tab?: TabId;
  closed?: boolean;
}

export class SpiritsScene extends Phaser.Scene {
  private session!: GardenSession;
  private selected = "";
  private tab: TabId = "overview";
  private open = true;
  /** 입력 처리 중에 지우면 안 돼서, 다시 그리기는 다음 update에서 해요 */
  private dirty = false;

  constructor() {
    super(SPIRITS_SCENE);
  }

  init(data: SpiritsSceneData) {
    const garden: Garden = GARDENS[data.scene ?? DEFAULT_GARDEN] ?? GARDENS[DEFAULT_GARDEN];
    this.session = data.session ?? new GardenSession(garden);
    this.selected = data.select ?? this.session.state.spirits[0].id;
    this.tab = data.tab ?? "overview";
    this.open = !data.closed;
  }

  preload() {
    for (const [id, w] of [...TOP_ICONS, ...ID_ICONS, ...STRIP_ICONS, ...PANEL_ICONS, ...RAIL_ICONS]) loadIcon(this, id, w);
  }

  create() {
    const off = this.session.onChange(() => this.redraw());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.leaveGrowth();
      off();
    });
    this.paint();
    Object.assign(window, { __screenReady: SPIRITS_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private redraw() {
    this.dirty = true;
  }

  private paint() {
    this.children.removeAll(true);
    const vm = spiritsVM(this.session.state, this.selected);
    const d = vm.detail;
    drawBackdrop(this);
    drawArt(this, !this.open);
    drawScrim(this);
    drawTopbar(this, vm.material);
    drawIdCard(this, d);
    if (this.open) {
      drawPanel(this, d, this.tab, {
        tab: (t) => this.show(this.selected, t, true),
        close: () => this.show(this.selected, this.tab, false),
        evolve: () => this.session.dispatch({ kind: "evolve", id: this.selected }),
        feed: () => this.session.dispatch({ kind: "feed", id: this.selected }),
        reroll: () => this.session.dispatch({ kind: "reroll", id: this.selected }),
        seeEpisode: () => this.session.dispatch({ kind: "seeEpisode", id: this.selected }),
      });
    } else {
      const openTab = (t: TabId) => this.show(this.selected, t, true);
      drawFacts(this, d, openTab);
      drawRail(this, d, openTab);
    }
    drawStrip(this, vm, (id) => this.show(id, this.tab, this.open));
  }

  /** 정령·탭·패널 상태를 바꿔요. 성장 길에서 나가면 그 정령의 새 해금을 본 것으로 (배지가 사라져요, "받기" 없음) */
  private show(id: string, tab: TabId, open: boolean) {
    const leaving = this.open && this.tab === "growth" && (id !== this.selected || tab !== "growth" || !open);
    if (leaving) this.leaveGrowth();
    this.selected = id;
    this.tab = tab;
    this.open = open;
    this.redraw();
  }

  private leaveGrowth() {
    if (this.open && this.tab === "growth") this.session.dispatch({ kind: "seeUnlocks", id: this.selected });
  }
}
