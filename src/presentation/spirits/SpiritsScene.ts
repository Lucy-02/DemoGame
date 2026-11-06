// 정령 관리 화면 (정본: 정령 관리 R4 v5, 탭 내용은 결정 0021). 정원 세션 상태 → 화면 데이터 → 그리기.
// 상태가 바뀌거나 탭·정령을 고르면 화면을 통째로 다시 그려요(정지 화면이라 충분히 가벼워요).
import * as Phaser from "phaser";
import type { Garden } from "../../core/garden";
import { GardenSession } from "../../session/garden";
import { createPuppet, ensurePuppet } from "../puppet/loadPuppet";
import type { PuppetCore } from "../puppet/puppetCore";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import type { Stage } from "../../core/types";
import { DEFAULT_GARDEN, GARDENS } from "./fixtures";
import { spiritsVM, type MockView } from "./fromGarden";
import { MOCKUPS, MOCK_FIRST_STAGE } from "./mockups";
import type { SpiritDetailVM, StatRowVM, TabId } from "./viewmodel";
import { playArtSwap, type ArtMotion } from "./views/artSwap";
import { drawArt, drawArtGlow, drawBackdrop, drawScrim, type LiveArt } from "./views/backdrop";
import { ID_ICONS, drawIdCard } from "./views/idCard";
import { PANEL_ICONS, drawPanel } from "./views/panel";
import { RAIL_ICONS, drawFacts, drawRail } from "./views/rail";
import { FRAME, STRIP } from "./layout";
import { STRIP_ICONS, clampFrom, drawStrip, stripFit } from "./views/strip";
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
  /** 목업 정령마다 지금 보여 줄 단계 (성장 길에서 눌러 바꿔요) */
  private mockStage = new Map<string, Stage>();
  private readonly mocks: MockView = { list: MOCKUPS, stage: (id) => this.mockStage.get(id) ?? MOCK_FIRST_STAGE };
  /** 아래 띠에서 맨 앞에 보이는 타일 번호 (휠로 넘겨요) */
  private stripFrom = 0;
  /** 입력 처리 중에 지우면 안 돼서, 다시 그리기는 다음 update에서 해요 */
  private dirty = false;
  /** 퍼핏 움직임 상태 (정령별). 화면을 다시 그려도 움직임이 처음부터 시작하지 않게 남겨 둬요 */
  private puppetCores = new Map<string, PuppetCore>();
  /** 마지막으로 그린 정령 (다른 정령을 고르면 여기서 전환해요, 0035) */
  private shown?: { id: string; art: SpiritDetailVM["art"]; rows?: StatRowVM[] };
  /** 다음 그리기에서 전환할지 */
  private swapPending = false;
  private artMotion: ArtMotion = { alpha: 1, dx: 0 };

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
    preloadSpiritArt(this, [...this.session.state.spirits.map((s) => s.id), ...MOCKUPS.map((m) => m.id)]);
  }

  create() {
    const off = this.session.onChange(() => this.redraw());
    // 다시 그리면 입력 대상이 새로 생겨요. 마우스를 움직이지 않아도 그 위의 커서를 유지해요
    this.input.setPollAlways();
    this.reveal(this.selected);
    // 아래 띠 위에서 휠을 굴리면 타일을 한 칸씩 넘겨요
    this.input.on("wheel", (p: Phaser.Input.Pointer, _o: unknown, dx: number, dy: number) => {
      if (p.y < FRAME.h - STRIP.h) return;
      const step = Math.sign(dy || dx);
      if (!step) return;
      this.stripFrom += step;
      this.redraw();
    });
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
    this.tweens.killAll();
    // children.removeAll(true)는 안 돼요: true가 "콜백 건너뛰기"라서 파괴되지 않고, 퍼핏은 계속 돌고 버튼은 계속 눌려요
    for (const o of [...this.children.list]) o.destroy();
    const vm = spiritsVM(this.session.state, this.selected, this.mocks);
    const d = vm.detail;
    const before = this.swapPending && this.shown?.id !== vm.selected ? this.shown : undefined;
    this.swapPending = false;
    drawBackdrop(this);
    drawArtGlow(this, !this.open);
    const out = before ? drawArt(this, !this.open, before.art, this.liveArt(before.art?.puppet)) : [];
    const into = drawArt(this, !this.open, d.art, this.liveArt(d.art?.puppet));
    if (before) {
      const order = vm.roster.map((t) => t.id);
      const dir = Math.sign(order.indexOf(vm.selected) - order.indexOf(before.id)) || 1;
      this.artMotion = playArtSwap(this, out, into, dir, this.artMotion);
    } else {
      this.artMotion = { alpha: 1, dx: 0 };
    }
    drawScrim(this);
    drawTopbar(this, vm.material);
    drawIdCard(this, d);
    if (this.open) {
      drawPanel(this, d, this.tab, {
        tab: (t) => this.show(this.selected, t, true),
        close: () => this.show(this.selected, this.tab, false),
        evolve: () => this.session.dispatch({ kind: "evolve", id: this.selected }),
        feed: () => this.session.dispatch({ kind: "feed", id: this.selected }),
        seeEpisode: () => this.session.dispatch({ kind: "seeEpisode", id: this.selected }),
        pickStage: (stage) => {
          this.mockStage.set(this.selected, stage);
          this.redraw();
        },
      }, before?.rows);
    } else {
      const openTab = (t: TabId) => this.show(this.selected, t, true);
      drawFacts(this, d, openTab);
      drawRail(this, d, openTab);
    }
    this.stripFrom = clampFrom(this.stripFrom, vm.roster.length);
    drawStrip(this, vm, this.stripFrom, (id) => this.show(id, this.tab, this.open));
    this.shown = { id: vm.selected, art: d.art, rows: this.open && this.tab === "overview" ? d.overview.rows : undefined };
  }

  /** 각성체 퍼핏(라투디). 처음 볼 때 불러오고, 다 올라올 때까지는 일러스트를 그려요 */
  private liveArt(id?: string): LiveArt | undefined {
    if (!id) return undefined;
    const ready = ensurePuppet(this, id, () => this.redraw());
    return {
      ready,
      place: (at, clip) => {
        const p = createPuppet(this, id, { core: this.puppetCores.get(id) });
        this.puppetCores.set(id, p.core);
        // 리그 캔버스의 일러스트 상자(art.bbox)가 일러스트 자리(at)에 꼭 맞게
        const [x0, y0, x1] = p.core.rig.art!.bbox;
        const s = at.w / (x1 - x0);
        return p.setScale(s).setPosition(at.x - x0 * s, at.y - y0 * s).setScreenClip(clip.top, clip.bottom, clip.fadeFrom);
      },
    };
  }

  /** 정령·탭·패널 상태를 바꿔요. 성장 길에서 나가면 그 정령의 새 해금을 본 것으로 (배지가 사라져요, "받기" 없음) */
  private show(id: string, tab: TabId, open: boolean) {
    const leaving = this.open && this.tab === "growth" && (id !== this.selected || tab !== "growth" || !open);
    if (leaving) this.leaveGrowth();
    if (id !== this.selected) this.swapPending = true;
    this.selected = id;
    this.tab = tab;
    this.open = open;
    this.reveal(id);
    this.redraw();
  }

  /** 고른 정령 타일이 아래 띠에 보이게 넘겨요 */
  private reveal(id: string) {
    const ids = [...this.session.state.spirits.map((s) => s.id), ...MOCKUPS.map((m) => m.id)];
    const i = ids.indexOf(id);
    if (i < 0) return;
    const fit = stripFit();
    if (i < this.stripFrom) this.stripFrom = i;
    else if (i >= this.stripFrom + fit) this.stripFrom = i - fit + 1;
  }

  private leaveGrowth() {
    const garden = this.session.state.spirits.some((s) => s.id === this.selected);
    if (garden && this.open && this.tab === "growth") this.session.dispatch({ kind: "seeUnlocks", id: this.selected });
  }
}
