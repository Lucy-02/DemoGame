// 진화 컷신 (0037, 유체 → 성체): 유체 희미해짐 → 가운데 그림자 → 속성 · 역할 → 성체 실루엣 → 공개(배경 무대 + 이름 띠).
// 빛 하나(뒤에서 비추는 속성 빛)와 움직임 하나(실루엣이 바뀌고 걷힘)만 있어요. 공개에서 멈추고, 누르면 부른 화면으로 돌아가요.
// 재생 중에 누르면 공개로 건너뛰어요. 동작 줄이기에서는 처음부터 공개 정지 화면이에요 (0012).
import * as Phaser from "phaser";
import { ELEMENT_NAME, ROLE_NAME, personalityDef, spiritDef } from "../../core/data";
import type { Stage } from "../../core/types";
import { tokens } from "../../design/tokens";
import { spiritArt, spiritArtFile } from "../spiritArt";
import { FONT_STACK } from "../style/fonts";
import { cleanEdges } from "./edges";
import { BEAT, EVO } from "./layout";
import { RES } from "../style/resolution";

export const EVOLUTION_SCENE = "evolution";

export interface EvolutionSceneData {
  id: string;
  from: Stage;
  to: Stage;
  /** 정령의 성격 id (이름 띠 칩) */
  personality?: string;
  /** 단계 이름 (이름 띠: "유리 도롱뇽 성체") */
  stageName: string;
  onDone: () => void;
  /** 시각 검증용: 이 박자의 정지 화면으로 */
  beat?: number;
}

/** 이 정령의 이 단계 진화에 컷신을 틀 수 있는지: 유체 → 성체이고 두 그림이 다 있을 때 (각성 연출은 아직 없어요) */
export const hasEvolutionCutscene = (id: string, from: Stage, to: Stage) =>
  from === "baby" && to === "adult" && !!spiritArt(id, from) && !!spiritArt(id, to);

const color = (css: string) => Phaser.Display.Color.HexStringToColor(css).color;
type Target = { t: object; [k: string]: unknown };

export class EvolutionScene extends Phaser.Scene {
  private d!: EvolutionSceneData;
  private beat = 0;
  private timer?: Phaser.Time.TimerEvent;
  private targets!: (n: number) => Target[];
  private easeOf!: (t: object, n: number) => string;

  constructor() {
    super(EVOLUTION_SCENE);
  }

  init(data: EvolutionSceneData) {
    this.d = data;
    this.beat = 0;
  }

  private key(what: string) {
    return `evo:${this.d.id}:${what}`;
  }

  preload() {
    const { id, from, to } = this.d;
    const def = spiritDef(id);
    const load = (k: string, f: () => void) => { if (!this.textures.exists(k)) f(); };
    load(this.key("from"), () => this.load.image(this.key("from"), spiritArtFile(id, from)));
    load(this.key("to"), () => this.load.image(this.key("to"), spiritArtFile(id, to)));
    load(this.key("stage"), () => this.load.image(this.key("stage"), spiritArtFile(id, to).replace(`${to}.webp`, "background.webp")));
    load(`evo:el:${def.element}`, () => this.load.svg(`evo:el:${def.element}`, `assets/ui/icons/el-${def.element}.svg`, { width: 512, height: 512 }));
    load(`evo:role:${def.role}`, () => this.load.svg(`evo:role:${def.role}`, `assets/ui/icons/role-${def.role}.svg`, { width: 256, height: 256 }));
    // 배경이 없는 정령은 무대 없이 틀어요
    this.load.on("loaderror", () => {});
  }

  create() {
    const E = EVO, { cx: CX } = E;
    const def = spiritDef(this.d.id);
    const glowCss = E.glow[def.element] ?? (tokens.provisional.palette.el as Record<string, string>)[def.element] ?? E.ink;
    const glow = color(glowCss);
    this.makeTextures();
    const cam = this.cameras.main;
    cam.setBackgroundColor(E.bg);

    const bgGlow = this.add.image(CX, E.cy, "evo:radial").setDisplaySize(E.bgGlow.w, E.bgGlow.h).setTint(glow).setBlendMode(Phaser.BlendModes.ADD);
    const hasStage = this.textures.exists(this.key("stage"));
    if (hasStage) cleanEdges(this, this.key("stage"), this.key("stageSoft"), E.stage);
    const stage = hasStage
      ? this.add.image(CX, E.adult.closeY, this.key("stageSoft")).setOrigin(0.5, E.stage.footY).setTint(E.stage.tint).setAlpha(0)
      : undefined;
    const shade = this.add.image(CX, E.shade.y, "evo:radial").setDisplaySize(E.shade.w, E.shade.h).setTint(0x000000);
    const zone = this.add.image(CX, E.zone.y, "evo:radial").setDisplaySize(E.zone.w, E.zone.h).setTint(glow).setBlendMode(Phaser.BlendModes.ADD);
    this.add.particles(0, 0, "evo:dot", {
      x: { min: 0, max: E.w }, y: E.h + 10, speedY: { min: E.motes.speedY[0], max: E.motes.speedY[1] }, speedX: { min: E.motes.speedX[0], max: E.motes.speedX[1] },
      lifespan: E.motes.lifespan, scale: { min: E.motes.scale[0], max: E.motes.scale[1] }, alpha: { start: E.motes.alpha, end: 0 },
      tint: glow, frequency: E.motes.frequency, blendMode: "ADD",
    });

    const baby = this.add.image(CX, E.baby.y, this.key("from")).setOrigin(0.5, 1);
    const babyScale = E.baby.h / baby.height;
    baby.setScale(babyScale);
    const adult = this.add.image(CX, E.adult.y, this.key("to")).setOrigin(0.5, 1).setAlpha(0);
    const adultScale = E.adult.h / adult.height, closeScale = E.adult.closeH / adult.height;
    adult.setScale(adultScale);
    const adultSil = this.add.image(adult.x, adult.y, this.key("to")).setOrigin(0.5, 1).setScale(adultScale)
      .setTint(color(E.sil)).setTintMode(Phaser.TintModes.FILL).setAlpha(0);
    adultSil.enableFilters();
    const G = E.adult.glow;
    const silGlow = adultSil.filters!.internal.addGlow(glow, G.strength, 0, 1, false, G.quality, G.distance);
    const wipe = adultSil.filters!.internal.addWipe(E.adult.wipe, 0, 1);
    wipe.setBottomToTop();
    wipe.progress = 0;

    // 속성 · 역할 기호와 이름은 실루엣보다 위에 그려요 (아래에 있으면 실루엣이 차오르며 먼저 덮여요)
    const crest = this.add.image(CX + E.crest.dx, E.crest.y, `evo:el:${def.element}`).setTint(glow).setDisplaySize(E.crest.size, E.crest.size).setDepth(10);
    const role = this.add.image(CX + E.role.dx, E.role.y, `evo:role:${def.role}`).setTint(color(E.ink)).setDisplaySize(E.role.size, E.role.size).setDepth(10);
    const label = (x: number, t: string, c: string) =>
      this.add.text(x, E.label.y, t, { fontFamily: FONT_STACK, fontSize: E.label.size, color: c, resolution: RES() }).setOrigin(0.5).setDepth(10);
    const elText = label(CX + E.crest.dx, ELEMENT_NAME[def.element], glowCss);
    const roleText = label(CX + E.role.dx, ROLE_NAME[def.role] ?? def.role, E.ink);

    // 성체 이름 띠: 속성 · 역할 · 성격 칩 + 이름. 공개 박자에만 떠요. 유체 정보는 띄우지 않아요
    const B = E.band;
    const band = this.add.container(B.x, E.h - B.bottom);
    let chipX = 0;
    const chip = (t: string, c: string) => {
      const o = this.add.text(chipX, B.chipY, t, { fontFamily: FONT_STACK, fontSize: B.chip, color: c, backgroundColor: E.chipBg, padding: B.chipPad, resolution: RES() });
      chipX += o.width + B.chipGap;
      band.add(o);
    };
    chip(ELEMENT_NAME[def.element], glowCss);
    chip(ROLE_NAME[def.role] ?? def.role, E.ink);
    if (this.d.personality) chip(personalityDef(this.d.personality).name, E.ink2);
    band.add(this.add.text(0, B.nameY, `${def.name} ${this.d.stageName}`, { fontFamily: FONT_STACK, fontSize: B.name, color: E.ink, resolution: RES() }));

    const vignette = cam.filters.external.addVignette(0.5, 0.5, E.vignette.radius, E.vignette.strength[0], 0x000000);
    // 글자는 따로 그리는 카메라로. 이름 띠 뒤 사선 흐림: 같은 장면을 흐린 카메라로 한 번 더 그리고 사선 마스크로 잘라요
    cam.ignore(band);
    const blurCam = this.cameras.add(0, 0, E.w, E.h).setAlpha(0);
    blurCam.ignore(band);
    blurCam.filters.external.addBlur(1, 2 * RES(), 2 * RES(), E.bandBlur.strength, 0xffffff, E.bandBlur.steps);
    blurCam.filters.external.addVignette(0.5, 0.5, E.vignette.radius, E.vignette.strength[BEAT.last], 0x000000);
    blurCam.filters.external.addMask("evo:bandMask");
    const uiCam = this.cameras.add(0, 0, E.w, E.h);
    uiCam.ignore(this.children.list.filter((c) => c !== band));

    const at = (v: number[], n: number) => v[n];
    this.targets = (n) => {
      const close = n >= BEAT.last;
      const body = { scale: close ? closeScale : adultScale, y: close ? E.adult.closeY : E.adult.y };
      const out: Target[] = [
        { t: bgGlow, alpha: at(E.bgGlow.alpha, n) },
        { t: shade, alpha: at(E.shade.alpha, n) },
        { t: zone, alpha: at(E.zone.alpha, n) },
        { t: crest, alpha: n === 3 ? E.crest.alpha : 0 },
        { t: role, alpha: n === 3 ? E.role.alpha : 0 },
        { t: roleText, alpha: n === 3 ? 1 : 0 },
        { t: elText, alpha: n === 3 ? 1 : 0 },
        // 유체는 사라지지 않고 희미하게 남았다가 성체 실루엣으로 바뀌어요
        { t: baby, alpha: at(E.baby.alpha, n), scale: n === 0 ? babyScale : babyScale * E.baby.shrink },
        { t: adult, alpha: n >= 4 ? 1 : 0, ...body },
        { t: adultSil, alpha: n === 4 ? 1 : 0, ...body, scale: close ? closeScale : adultScale * (n === 4 ? 1 : E.adult.silShrink) },
        { t: wipe, progress: close ? 1 : 0 },
        { t: band, alpha: close ? 1 : 0 },
        { t: blurCam, alpha: close ? 1 : 0 },
        { t: vignette, strength: at(E.vignette.strength, n) },
      ];
      // 배경 무대는 성체와 한 몸처럼 같은 자리 · 같은 배율로 따라와요
      if (stage) out.push({ t: stage, alpha: close ? 1 : 0, scale: (close ? E.adult.closeH : E.adult.h) / E.stage.adultFrac / stage.height, y: body.y });
      return out;
    };
    // 나타남은 빨리 시작해 천천히 멈추고(out), 사라짐과 배경 조명은 부드럽게(in · inOut)
    this.easeOf = (t, n) => {
      if (t === adult || t === adultSil || t === stage) return n === BEAT.last ? "Cubic.out" : "Sine.inOut";
      if (t === band || t === blurCam) return "Sine.out";
      if (t === crest || t === role || t === roleText || t === elText) return n === 3 ? "Cubic.out" : "Sine.in";
      if (t === baby) return "Sine.out";
      return "Sine.inOut";
    };
    this.silGlow = silGlow;
    this.roleIcon = role;
    this.wipeFx = wipe;
    this.adultImg = adult;
    this.adultSil = adultSil;

    const still = this.d.beat !== undefined || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.snap(still ? this.d.beat ?? BEAT.last : 0);
    if (!still) {
      this.tweens.add({ targets: baby, scaleY: babyScale * E.baby.breathe.scale, yoyo: true, repeat: -1, duration: E.baby.breathe.ms, ease: "Sine.inOut" });
      this.timer = this.time.delayedCall(BEAT.start, () => this.enter(1));
    }
    this.input.on("pointerup", () => this.press());
    this.input.keyboard?.on("keydown", () => this.press());
    Object.assign(window, { __screenReady: EVOLUTION_SCENE });
  }

  private silGlow!: Phaser.Filters.Glow;
  private wipeFx!: object;
  private roleIcon!: object;
  private adultImg!: Phaser.GameObjects.Image;
  private adultSil!: Phaser.GameObjects.Image;

  /** 누르면: 재생 중에는 공개로 건너뛰고, 공개에서는 돌아가요 */
  private press() {
    if (this.beat < BEAT.last) return this.snap(BEAT.last);
    this.d.onDone();
  }

  /** 박자 n이 끝났을 때의 모습으로 바로 */
  private snap(n: number) {
    this.timer?.remove();
    this.tweens.killAll();
    this.beat = n;
    for (const { t, ...props } of this.targets(n)) Object.assign(t, props);
  }

  private enter(n: number) {
    this.beat = n;
    const d = BEAT.ms[n];
    for (const { t, ...props } of this.targets(n)) {
      // 역할 기호는 나타날 때만 살짝 늦게 와요. 사라질 땐 속성 기호 · 글자와 함께 사라져요
      const roleIn = t === this.roleIcon && n === 3;
      const slow = t === this.wipeFx || (t === this.adultSil && n === BEAT.last);
      this.tweens.add({
        targets: t, ...props, ease: this.easeOf(t, n),
        duration: roleIn ? BEAT.roleIn.ms : d * (slow ? BEAT.wipe : BEAT.move), delay: roleIn ? BEAT.roleIn.delay : 0,
      });
    }
    if (n === 4) this.tweens.add({ targets: this.silGlow, outerStrength: { from: 2, to: EVO.adult.glow.to }, duration: d });
    if (n === BEAT.last) {
      this.adultImg.setAlpha(1);
      this.adultSil.setAlpha(1);
      return;
    }
    this.timer = this.time.delayedCall(d, () => this.enter(n + 1));
  }

  private makeTextures() {
    const radial = (key: string, size: number, stops: [number, string][]) => {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, size, size)!;
      const ctx = t.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([p, c]) => g.addColorStop(p, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      t.refresh();
    };
    radial("evo:dot", 64, [[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,.8)"], [1, "rgba(255,255,255,0)"]]);
    radial("evo:radial", 512, [[0, "rgba(255,255,255,.55)"], [0.35, "rgba(255,255,255,.18)"], [1, "rgba(255,255,255,0)"]]);
    // 사선 마스크: 왼쪽 아래 모서리는 불투명, 가운데 쪽으로 갈수록 투명
    if (this.textures.exists("evo:bandMask")) return;
    const cv = document.createElement("canvas");
    cv.width = EVO.w;
    cv.height = EVO.h;
    const g = cv.getContext("2d")!;
    const [x1, y1, hold] = EVO.bandBlur.reach;
    const grad = g.createLinearGradient(0, EVO.h, x1, y1);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(hold, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, EVO.w, EVO.h);
    this.textures.addCanvas("evo:bandMask", cv);
  }
}
