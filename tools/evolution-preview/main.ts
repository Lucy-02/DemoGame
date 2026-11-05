// 진화 연출 미리보기 (개발 서버 전용: pnpm dev:web → /evolution-preview.html?spirit=glass-salamander&branch=1).
// 유체 → 성체 A안(모임 → 속성 → 역할 → 변화 → 공개 → 정리)을 게임 엔진(Phaser 4 필터·파티클·카메라)으로 그려 보는 시안이에요.
// 색·크기·시간·숫자는 모두 시안용 임시 값(TODO_TOKEN)이고, 갈래 이름은 TODO_NAME이에요. 게임 규칙(src/core)은 건드리지 않아요.
import * as Phaser from "phaser";

type Role = "guard" | "attack" | "support" | "disrupt";
type Branch = { meaning: string; role: Role; stats: [string, number, number][] };
type Spirit = { name: string; el: "fire" | "water"; elName: string; color: number; pers: string; persDesc: string; roles: Role[]; branches: Branch[] };

// 시안용 예시 데이터. 갈래 뜻은 design/canon/naming/TODO_NAMES.md, 능력치는 0021 표를 따른 임시 숫자예요.
const SPIRITS: Record<string, Spirit> = {
  "glass-salamander": {
    name: "유리 도롱뇽", el: "fire", elName: "불", color: 0xff7a4d, pers: "신중", persDesc: "가드 +15%", roles: ["guard"],
    branches: [
      { meaning: "받아내기", role: "guard", stats: [["HP", 38, 44], ["가드", 13, 15]] },
      { meaning: "되돌리기", role: "attack", stats: [["파워", 9, 11], ["가드", 13, 15]] },
    ],
  },
  "mist-cat": {
    name: "안개 고양이", el: "water", elName: "물", color: 0x8ec2ff, pers: "총명", persDesc: "포커스 +15%", roles: ["support", "disrupt"],
    branches: [
      { meaning: "얼리기", role: "disrupt", stats: [["포커스", 13, 15], ["싱크", 12, 14]] },
      { meaning: "지키기", role: "support", stats: [["포커스", 13, 15], ["싱크", 12, 14]] },
    ],
  },
};
const ROLE: Record<Role, string> = { guard: "수호", attack: "공격", support: "보조", disrupt: "교란" };
const q0 = new URLSearchParams(location.search);
// 덜어낸 판(Lucy 11/04): 유체 희미해짐 → 가운데 그림자 영역 → 가운데 속성·역할 → 성체 실루엣 → 공개 → 정리. 조금 빠르게.
const BEATS = q0.get("look") !== "full" ? ["대기", "희미해짐", "그림자", "속성·역할", "변화", "공개", "정리"] : ["대기", "모임", "속성", "역할", "변화", "공개", "정리"];
const DUR = q0.get("look") !== "full" ? [0, 700, 800, 1300, 1300, 1500, 0] : [0, 1500, 1700, 1500, 2600, 2200, 0]; // ms, 임시
const W = 1280, H = 720, CX = W / 2, CY = H * 0.56;
const FONT = "Orbit, Pretendard, sans-serif";

const q = new URLSearchParams(location.search);
const spiritId = q.get("spirit") && SPIRITS[q.get("spirit")!] ? q.get("spirit")! : "glass-salamander";
const S = SPIRITS[spiritId];
const branchIdx = Math.min(S.branches.length - 1, Number(q.get("branch") ?? (spiritId === "glass-salamander" ? 1 : 0)));
const B = S.branches[branchIdx];
const autoplay = q.get("autoplay") === "1";
const capture = q.get("capture") === "1";
// look=calm(기본): 빛 하나·움직임 하나로 덜어낸 판(Lucy 11/04 "이펙트가 덕지덕지 과함"). look=full: 첫 판(빛줄기·폭발·고리·흔들림·블룸).
const CALM = q.get("look") !== "full";
// 배경 무대(Lucy 11/05, 시안): stage=none | reveal(공개 때 펼쳐짐) | always(처음부터 깔림). 배경은 정령별 background.webp(누끼 확정본).
const STAGE = (["none", "reveal", "always"] as const).find((v) => v === q.get("stage")) ?? "none";
const BG_SIZE = 1000; // 임시: 정령 중심으로 넉넉하게, 화면 밖으로 잘려도 돼요(Lucy 11/05)

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const pick = $("spirit") as HTMLSelectElement, br = $("branch") as HTMLSelectElement;
pick.innerHTML = Object.entries(SPIRITS).map(([k, v]) => `<option value="${k}"${k === spiritId ? " selected" : ""}>${v.name}</option>`).join("");
br.innerHTML = S.branches.map((b, i) => `<option value="${i}"${i === branchIdx ? " selected" : ""}>${b.meaning} (${ROLE[b.role]})</option>`).join("");
const reload = () => (location.search = `?spirit=${pick.value}&branch=${pick.value === spiritId ? br.value : 0}${STAGE !== "none" ? `&stage=${STAGE}` : ""}`);
pick.onchange = reload;
br.onchange = reload;

class Evolution extends Phaser.Scene {
  private beat = 0;
  private still = false;
  private o!: {
    bgGlow: Phaser.GameObjects.Image; rays: Phaser.GameObjects.Container; crest: Phaser.GameObjects.Image; ring: Phaser.GameObjects.Image;
    baby: Phaser.GameObjects.Image; babySil: Phaser.GameObjects.Image; adult: Phaser.GameObjects.Image; adultSil: Phaser.GameObjects.Image;
    role: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle;
    roleText: Phaser.GameObjects.Text; elText: Phaser.GameObjects.Text; band: Phaser.GameObjects.Container; nameSmall: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text;
    roleChip: Phaser.GameObjects.Text; panel: Phaser.GameObjects.Container; caption: Phaser.GameObjects.Text;
    gather: Phaser.GameObjects.Particles.ParticleEmitter; burst: Phaser.GameObjects.Particles.ParticleEmitter; motes: Phaser.GameObjects.Particles.ParticleEmitter;
    babyGlow: Phaser.Filters.Glow; silGlow: Phaser.Filters.Glow; wipe: Phaser.Filters.Wipe; vignette: Phaser.Filters.Vignette;
  };
  private timer?: Phaser.Time.TimerEvent;
  private zone!: Phaser.GameObjects.Image;
  private shade!: Phaser.GameObjects.Image;
  private stage?: Phaser.GameObjects.Image;

  preload() {
    this.load.image("baby", `assets/spirits/${spiritId}/baby.webp`);
    this.load.image("adult", `assets/spirits/${spiritId}/adult.webp`);
    // 속성·역할 아이콘 (확정본 el-·role-, 0024)
    this.load.svg("crest", `assets/ui/icons/el-${S.el}.svg`, { width: 512, height: 512 });
    this.load.svg("role", `assets/ui/icons/role-${B.role}.svg`, { width: 256, height: 256 });
    if (STAGE !== "none") this.load.image("stage", `assets/spirits/${spiritId}/background.webp`);
    this.load.on("loaderror", () => {});
  }

  create() {
    this.makeTextures();
    const cam = this.cameras.main;
    const crestKey = "crest";

    const bg = this.add.rectangle(CX, H / 2, W, H, 0x141214);
    void bg;
    const bgGlow = this.add.image(CX, CY, "radial").setDisplaySize(W * 1.3, H * 1.5).setTint(S.color).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    // 무대는 유체 발밑(CY + 150)에 바닥이 오게 깔아요. 그림자·비네트가 무대 위로 덮여서 함께 어두워져요.
    const stage = STAGE !== "none" ? this.add.image(CX, CY + 150, "stage").setOrigin(0.5, 0.86).setDisplaySize(BG_SIZE, BG_SIZE).setAlpha(0) : undefined;

    // 덜어낸 판의 가운데 영역: 어두운 바탕 위에 속성 빛이 번진 세로 타원
    const shade = this.add.image(CX, CY - 60, "radial").setDisplaySize(760, 860).setTint(0x000000).setAlpha(0);
    const zone = this.add.image(CX, CY - 60, "radial").setDisplaySize(560, 700).setTint(S.color).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const rays = this.add.container(CX, CY - 40).setAlpha(0);
    for (let i = 0; i < 14; i++) {
      const r = this.add.image(0, 0, "ray").setOrigin(0.5, 1).setRotation((i / 14) * Math.PI * 2).setTint(S.color).setBlendMode(Phaser.BlendModes.ADD);
      r.setScale(1 + (i % 3) * 0.35, 1.4 + (i % 4) * 0.3).setAlpha(0.35 + (i % 2) * 0.25);
      rays.add(r);
    }
    const crest = CALM
      ? this.add.image(CX - 72, CY - 90, crestKey).setTint(S.color).setAlpha(0).setScale(0.24)
      : this.add.image(CX, CY - 70, crestKey).setTint(S.color).setAlpha(0).setScale(0.6).setBlendMode(Phaser.BlendModes.ADD);
    const ring = this.add.image(CX, CY - 40, "ring").setTint(S.color).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

    const motes = this.add.particles(0, 0, "dot", {
      x: { min: 0, max: W }, y: H + 10, speedY: { min: -40, max: -12 }, speedX: { min: -8, max: 8 }, lifespan: 9000,
      scale: { min: 0.08, max: 0.22 }, alpha: { start: 0.5, end: 0 }, tint: S.color, frequency: CALM ? 600 : 140, blendMode: "ADD",
    });

    const babyH = 330, adultH = 640;
    const baby = this.add.image(CX, CY + 150, "baby").setOrigin(0.5, 1);
    baby.setScale(babyH / baby.height);
    const babySil = this.add.image(baby.x, baby.y, "baby").setOrigin(0.5, 1).setScale(baby.scale).setTint(0x0b0a0c).setTintMode(Phaser.TintModes.FILL).setAlpha(0);
    const adult = this.add.image(CX, CY + 300, "adult").setOrigin(0.5, 1).setAlpha(0);
    adult.setScale(adultH / adult.height);
    const adultSil = this.add.image(adult.x, adult.y, "adult").setOrigin(0.5, 1).setScale(adult.scale).setTint(0x0b0a0c).setTintMode(Phaser.TintModes.FILL).setAlpha(0);

    baby.enableFilters();
    const babyGlow = baby.filters!.internal.addGlow(S.color, 0, 0, 1, false, 10, CALM ? 12 : 18);
    babySil.enableFilters();
    babySil.filters!.internal.addGlow(S.color, CALM ? 3 : 6, 0, 1, false, 10, CALM ? 12 : 18);
    adultSil.enableFilters();
    const silGlow = adultSil.filters!.internal.addGlow(S.color, CALM ? 3 : 8, 0, 1, false, 10, CALM ? 12 : 18);
    const wipe = adultSil.filters!.internal.addWipe(0.18, 0, 1);
    wipe.setBottomToTop();
    wipe.progress = 0; // 0 = 다 보임, 1 = 다 걷힘

    const gather = this.add.particles(CX, CY - 40, "dot", {
      emitZone: { type: "edge", source: new Phaser.Geom.Circle(0, 0, 460), quantity: 90 },
      moveToX: 0, moveToY: 0, lifespan: { min: 700, max: 1200 }, scale: { start: 0.35, end: 0.05 }, alpha: { start: 0, end: 1 },
      tint: S.color, blendMode: "ADD", frequency: 12, emitting: false,
    });
    const burst = this.add.particles(CX, CY - 60, "dot", {
      speed: { min: 180, max: 760 }, lifespan: { min: 900, max: 1700 }, scale: { start: 0.45, end: 0 }, alpha: { start: 1, end: 0 },
      tint: [S.color, 0xffffff], blendMode: "ADD", emitting: false, gravityY: 40,
    });

    let role: Evolution["o"]["role"];
    if (this.textures.exists("role")) role = this.add.image(CALM ? CX + 72 : CX, CALM ? CY - 90 : CY - 235, "role").setTint(0xf4eef2).setAlpha(0).setScale(CALM ? 0.45 : 0.5);
    else role = this.add.text(CALM ? CX + 72 : CX, CALM ? CY - 90 : CY - 235, ROLE[B.role], { fontFamily: FONT, fontSize: "64px", color: "#f4eef2" }).setOrigin(0.5).setAlpha(0);
    // 컷신은 무엇으로 자라는지만 보여줘요. 이미 아는 유체 정보(역할 등)는 띄우지 않아요(Lucy 11/04).
    // 아이콘마다 아래에 한글 이름을 달아요: 속성 아래 속성 이름, 역할 아래 역할 이름(Lucy 11/04).
    const label = (x: number, y: number, t: string, color: string) => this.add.text(x, y, t, {
      fontFamily: FONT, fontSize: "26px", color, stroke: "#000000", strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);
    const roleText = label(CALM ? CX + 72 : CX, CALM ? CY - 2 : CY - 330, ROLE[B.role], "#f4eef2");
    const elText = label(CX - 72, CY - 2, S.elName, "#" + S.color.toString(16));

    // 성체 이름 띠: 속성·역할·성격 칩 + 이름. 공개 박자에만 떠요.
    // 유체 정보 띠는 만들지 않아요. 이미 아는 정보라 컷신에 띄울 필요가 없어요(Lucy 11/04).
    const band = this.add.container(56, H - 70).setAlpha(0);
    const chip = (x: number, t: string, c: string) => this.add.text(x, -64, t, { fontFamily: FONT, fontSize: "17px", color: c, backgroundColor: "#1d1a1ecc", padding: { x: 10, y: 5 } });
    const c1 = chip(0, `${S.elName}`, "#" + S.color.toString(16));
    const roleChip = chip(c1.width + 8, ROLE[B.role], "#f4eef2");
    const c3 = chip(c1.width + roleChip.width + 16, `성격 ${S.pers} · ${S.persDesc}`, "#cfc6cc");
    const nameSmall = this.add.text(0, -26, `${B.meaning} 갈래 · TODO_NAME`, { fontFamily: FONT, fontSize: "16px", color: "#a49ca2" });
    const name = this.add.text(0, -4, `${S.name} 성체`, { fontFamily: FONT, fontSize: "40px", color: "#f4eef2", stroke: "#000000", strokeThickness: 6 });
    band.add([c1, roleChip, c3, nameSmall, name]);

    const panel = this.add.container(W - 470, 90).setAlpha(0);
    const pg = this.add.graphics();
    pg.fillStyle(0x1c191d, 0.92).fillRoundedRect(0, 0, 410, 470, 18).lineStyle(1, 0x3a363b).strokeRoundedRect(0, 0, 410, 470, 18);
    panel.add(pg);
    panel.add(this.add.text(28, 26, `${S.name} 성체가 되었어요`, { fontFamily: FONT, fontSize: "24px", color: "#f4eef2" }));
    const rows: [string, string][] = [["갈래", `${B.meaning} (TODO_NAME)`], ["역할", ROLE[B.role]], ...B.stats.map(([k, a, b]) => [k, `${a} → ${b} ▲`] as [string, string]), ["성격", `${S.pers} (그대로)`], ["해금", "전용 카드 1장"]];
    rows.forEach(([k, v], i) => {
      panel.add(this.add.text(28, 84 + i * 50, k, { fontFamily: FONT, fontSize: "18px", color: "#a49ca2" }));
      panel.add(this.add.text(382, 84 + i * 50, v, { fontFamily: FONT, fontSize: "18px", color: v.includes("▲") ? "#d7a3c8" : "#f4eef2" }).setOrigin(1, 0));
    });
    panel.add(this.add.text(28, 410, "정산으로", { fontFamily: FONT, fontSize: "18px", color: "#f4eef2", backgroundColor: "#2b2730", padding: { x: 14, y: 7 } }));

    const caption = this.add.text(W - 24, 20, "", { fontFamily: FONT, fontSize: "15px", color: "#a49ca2" }).setOrigin(1, 0);

    // 화면 전체: 블룸 + 비네트
    if (!CALM) Phaser.Actions.AddEffectBloom(cam, { threshold: 0.72, blurRadius: 2, blurSteps: 4, blurQuality: 1, blendAmount: 0.45 });
    const vignette = cam.filters.external.addVignette(0.5, 0.5, 0.75, 0.25, 0x000000);

    // 글자·패널은 확대·블룸이 없는 UI 카메라로 따로 그려요.
    const ui = [band, panel, caption];
    cam.ignore(ui);
    const uiCam = this.cameras.add(0, 0, W, H);
    uiCam.ignore(this.children.list.filter((c) => !ui.includes(c as never)));
    this.zone = zone;
    this.shade = shade;
    this.stage = stage;
    this.o = { bgGlow, rays, crest, ring, baby, babySil, adult, adultSil, role, roleText, elText, band, nameSmall, name, roleChip, panel, caption, gather, burst, motes, babyGlow, silGlow, wipe, vignette };

    // 유체 숨쉬기
    this.tweens.add({ targets: [baby], scaleY: baby.scale * 1.015, yoyo: true, repeat: -1, duration: 1400, ease: "Sine.inOut" });

    $("play").onclick = () => this.play();
    $("prev").onclick = () => this.go(this.beat - 1);
    $("next").onclick = () => this.go(this.beat + 1);
    $("skip").onclick = () => this.go(6);
    ($("still") as HTMLInputElement).onchange = (e) => { this.still = (e.target as HTMLInputElement).checked; this.go(this.beat); };
    this.still = ($("still") as HTMLInputElement).checked || matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.go(0);
    if (autoplay) this.time.delayedCall(800, () => this.play());
  }

  update(_t: number, dt: number) {
    if (!this.still) this.o.rays.rotation += dt * 0.00008 * (this.beat === 4 ? 3 : 1);
  }

  private makeTextures() {
    const radial = (key: string, size: number, stops: [number, string][]) => {
      const t = this.textures.createCanvas(key, size, size)!;
      const ctx = t.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([p, c]) => g.addColorStop(p, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      t.refresh();
    };
    radial("dot", 64, [[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,.8)"], [1, "rgba(255,255,255,0)"]]);
    radial("radial", 512, [[0, "rgba(255,255,255,.55)"], [0.35, "rgba(255,255,255,.18)"], [1, "rgba(255,255,255,0)"]]);
    const ray = this.textures.createCanvas("ray", 80, 600)!;
    const rc = ray.getContext();
    const lg = rc.createLinearGradient(0, 600, 0, 0);
    lg.addColorStop(0, "rgba(255,255,255,.55)");
    lg.addColorStop(1, "rgba(255,255,255,0)");
    rc.fillStyle = lg;
    rc.beginPath();
    rc.moveTo(40, 600);
    rc.lineTo(0, 0);
    rc.lineTo(80, 0);
    rc.closePath();
    rc.fill();
    ray.refresh();
    const ring = this.textures.createCanvas("ring", 512, 512)!;
    const gc = ring.getContext();
    gc.strokeStyle = "rgba(255,255,255,.9)";
    gc.lineWidth = 6;
    gc.shadowColor = "white";
    gc.shadowBlur = 18;
    gc.beginPath();
    gc.arc(256, 256, 220, 0, Math.PI * 2);
    gc.stroke();
    ring.refresh();
  }

  /** 박자 n이 끝났을 때의 모습. 박자를 건너뛰거나 동작 줄이기일 때 바로 이 값으로 둬요. */
  private target(n: number) {
    const o = this.o;
    if (CALM) return this.calmTarget(n);
    const babyScale = 330 / o.baby.height, adultScale = 640 / o.adult.height, closeScale = 1180 / o.adult.height;
    return [
      { t: o.bgGlow, alpha: [0.18, 0.3, 0.7, 0.7, 0.95, 0.55, 0.45][n] },
      { t: o.rays, alpha: [0, 0, 0.45, 0.5, 0.85, 0.55, 0.3][n] },
      { t: o.crest, alpha: [0, 0, 0.32, 0.32, 0.16, 0.08, 0][n], scale: [0.7, 0.7, 1.15, 1.15, 1.35, 1.45, 1.45][n] },
      { t: o.baby, alpha: n <= 3 ? 1 : 0, scale: n <= 3 ? babyScale * (n >= 1 ? 1.04 : 1) : babyScale * 1.3 },
      { t: o.babyGlow, outerStrength: [0, 4, 6, 6, 8, 0, 0][n] },
      { t: o.babySil, alpha: 0, scale: n <= 3 ? babyScale : babyScale * 1.3 },
      { t: o.adult, alpha: n >= 4 ? 1 : 0, scale: n >= 5 ? closeScale : adultScale, x: n >= 6 ? CX - 250 : CX, y: n >= 5 ? H + 520 : CY + 300 },
      { t: o.adultSil, alpha: n === 4 ? 1 : 0, scale: n >= 5 ? closeScale : adultScale, x: n >= 6 ? CX - 250 : CX, y: n >= 5 ? H + 520 : CY + 300 },
      { t: o.wipe, progress: n >= 5 ? 1 : 0 },
      { t: o.role, alpha: n === 3 ? 1 : 0, y: n >= 3 ? CY - 235 : CY - 420 },
      { t: o.roleText, alpha: n === 3 ? 1 : 0 },
      { t: o.elText, alpha: CALM && n === 3 ? 1 : 0 },
      { t: o.band, alpha: n === 5 ? 1 : 0 },
      { t: o.panel, alpha: n === 6 ? 1 : 0, x: n === 6 ? W - 470 : W - 440 },
      { t: o.vignette, strength: [0.25, 0.6, 0.7, 0.7, 0.8, 0.45, 0.4][n] },
      { t: this.cameras.main, zoom: [1, 1.05, 1.06, 1.08, 1.12, 1, 1][n] },
    ] as { t: object; [k: string]: unknown }[];
  }

  /** 덜어낸 판: 빛 하나(뒤에서 비추는 속성 빛)와 움직임 하나(실루엣이 바뀌고 걷힘)만 남겨요. */
  private calmTarget(n: number) {
    const o = this.o;
    const babyScale = 330 / o.baby.height, adultScale = 640 / o.adult.height, closeScale = 1180 / o.adult.height;
    const pick = (v: number[]) => v[n];
    return [
      { t: o.bgGlow, alpha: pick([0.12, 0.08, 0.06, 0.06, 0.08, 0.2, 0.2]) },
      { t: this.shade, alpha: pick([0, 0.3, 0.75, 0.75, 0.7, 0, 0]) },
      { t: this.zone, alpha: pick([0, 0, 0.5, 0.55, 0.6, 0.25, 0.15]) },
      { t: o.rays, alpha: 0 },
      { t: o.crest, alpha: n === 3 ? 0.95 : 0 },
      { t: o.role, alpha: n === 3 ? 0.95 : 0 },
      { t: o.roleText, alpha: n === 3 ? 1 : 0 },
      { t: o.elText, alpha: CALM && n === 3 ? 1 : 0 },
      { t: o.baby, alpha: pick([1, 0.5, 0.35, 0.3, 0, 0, 0]), scale: n === 0 ? babyScale : babyScale * 0.98 }, // 유체는 사라지지 않고 희미하게 남았다가 성체 실루엣으로 바뀌어요(Lucy 11/04)
      { t: o.babyGlow, outerStrength: 0 },
      { t: o.babySil, alpha: 0 },
      { t: o.adult, alpha: n >= 4 ? 1 : 0, scale: n >= 5 ? closeScale : adultScale, x: n >= 6 ? CX - 250 : CX, y: n >= 5 ? H + 520 : CY + 300 },
      { t: o.adultSil, alpha: n === 4 ? 1 : 0, scale: n >= 5 ? closeScale : adultScale * (n === 4 ? 1 : 0.96), x: n >= 6 ? CX - 250 : CX, y: n >= 5 ? H + 520 : CY + 300 },
      { t: o.wipe, progress: n >= 5 ? 1 : 0 },
      { t: o.band, alpha: n === 5 ? 1 : 0 },
      { t: o.panel, alpha: n === 6 ? 1 : 0, x: n === 6 ? W - 470 : W - 440 },
      { t: o.vignette, strength: pick([0.25, 0.35, 0.45, 0.45, 0.45, 0.3, 0.3]) },
      { t: this.cameras.main, zoom: 1 },
      ...this.stageTarget(n),
    ] as { t: object; [k: string]: unknown }[];
  }

  /** 배경 무대 두 가지 시안. 유체 때 무대는 그림자 박자에 같이 가라앉고, 공개 때 성체와 함께 밝아져요. */
  private stageTarget(n: number) {
    const out: { t: object; [k: string]: unknown }[] = [];
    const m = this.stage;
    const grow = (k: number) => (n >= 5 ? 1.06 * k : k);
    const sc = (img: Phaser.GameObjects.Image) => grow(BG_SIZE / img.width);
    const x = n >= 6 ? CX - 250 : CX; // 정리 박자엔 성체를 따라 왼쪽으로
    if (STAGE === "reveal" && m) out.push({ t: m, alpha: n >= 5 ? 1 : 0, scale: sc(m), x });
    if (STAGE === "always" && m) out.push({ t: m, alpha: [1, 0.55, 0.3, 0.3, 0.35, 1, 1][n], scale: sc(m), x });
    return out;
  }

  private go(n: number) {
    n = Phaser.Math.Clamp(n, 0, 6);
    this.timer?.remove();
    this.tweens.killTweensOf(this.target(0).map((x) => x.t));
    const prev = this.beat;
    this.beat = n;
    const o = this.o;
    o.caption.setText(n ? `${n} ${BEATS[n]}` : "대기 · 키우기를 누르면 시작");
    $("hud").textContent = `박자 ${n}/6 ${BEATS[n]}`;

    const animate = !this.still && n === prev + 1 && n > 0;
    if (!animate) {
      for (const { t, ...props } of this.target(n)) Object.assign(t, props);
      o.gather.stop();
      return;
    }
    this.enter(n);
  }

  private enter(n: number) {
    const o = this.o, d = DUR[n] || 900, cam = this.cameras.main;
    const ease: Record<string, string> = CALM ? {} : { crest: "Back.out", role: "Bounce.out" };
    // 기본: 모든 값을 이번 박자 목표로 부드럽게
    for (const { t, ...props } of this.target(n)) {
      const key = t === o.crest ? "crest" : t === o.role ? "role" : "";
      const dur = t === o.role ? 700 : t === o.wipe ? d * 0.8 : t === (o.adultSil as object) && n === 5 ? d * 0.8 : d * 0.7;
      this.tweens.add({ targets: t, ...props, duration: dur, ease: ease[key] ?? "Sine.inOut", delay: t === o.role ? 150 : 0 });
    }
    if (n === 1 && !CALM) o.gather.start();
    if (n === 2 && !CALM) this.ripple(1.0);
    if (n === 3 && !CALM) this.time.delayedCall(820, () => { cam.shake(160, 0.003); this.ripple(0.7); });
    if (n === 4 && !CALM) {
      // 유체 → 실루엣 → 성체 실루엣 (깜박임 없이 느린 겹침)
      o.babySil.setAlpha(0).setScale(o.baby.scale);
      o.adult.setAlpha(0);
      this.tweens.killTweensOf([o.baby, o.babySil, o.adult, o.adultSil]);
      this.tweens.chain({ tweens: [
        { targets: o.babySil, alpha: 1, duration: 500, ease: "Sine.in" },
        { targets: [o.babySil], scale: o.baby.scale * (CALM ? 1.12 : 1.3), duration: 900, ease: "Sine.inOut", onStart: () => { o.baby.setAlpha(0); } },
        { targets: o.babySil, alpha: 0, duration: 900, ease: "Sine.inOut", onStart: () => { this.tweens.add({ targets: o.adultSil, alpha: 1, duration: 900, ease: "Sine.inOut" }); } },
      ] });
      this.tweens.add({ targets: o.silGlow, outerStrength: CALM ? { from: 2, to: 5 } : { from: 4, to: 14 }, duration: d, yoyo: false });
      o.gather.frequency = 5;
    }
    if (n === 5) {
      o.adult.setAlpha(1);
      o.adultSil.setAlpha(1);
      this.tweens.add({ targets: o.babySil, alpha: 0, duration: 300 });
      o.gather.stop();
      o.gather.frequency = 12;
      if (!CALM) {
        o.burst.explode(140);
        this.ripple(1.6);
        cam.shake(220, 0.004);
      }
    }
    if (n < 6 && DUR[n]) this.timer = this.time.delayedCall(DUR[n], () => { if (this.autoRun) this.go(n + 1); });
    else this.autoRun = false;
  }

  private autoRun = false;
  private play() {
    this.go(0);
    this.autoRun = true;
    this.time.delayedCall(300, () => this.go(1));
  }

  private ripple(size: number) {
    const r = this.o.ring;
    r.setScale(0.25).setAlpha(0.9);
    this.tweens.add({ targets: r, scale: size * 1.6, alpha: 0, duration: 1100, ease: "Cubic.out" });
  }
}

const start = async () => {
  try {
    const f = new FontFace("Orbit", "url(assets/fonts/Orbit-Regular.ttf)");
    document.fonts.add(await f.load());
  } catch { /* 글꼴이 없으면 대체 글꼴 */ }
  // ?capture=1: 영상으로 뽑을 때 프레임을 직접 넘겨요(tools/evolution-preview/record.cjs).
  const game = new Phaser.Game({ type: Phaser.WEBGL, parent: "stage", width: W, height: H, backgroundColor: "#141214", scene: Evolution, banner: false, render: { preserveDrawingBuffer: capture, mipmapFilter: "LINEAR_MIPMAP_LINEAR" } }); // 밉맵: 큰 배경을 줄여 그릴 때 계단·반짝임 줄이기
  if (capture) (window as unknown as { __game: Phaser.Game }).__game = game;
};
void start();

