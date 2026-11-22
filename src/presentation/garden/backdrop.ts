// 메인(정원)의 움직이는 배경 (0164 · 0165 · 0166). 그림: public/assets/stages/main, 만들기: tools/art/main-bg.py
// 층: 하늘(느리게 좌우) → 별 반짝임 → 밤 구름 → 나무 윗부분(바람) → 잎 덩어리(따로 흔들림) → 땅 · 집 → 창 · 등불 빛 → 반딧불 → 굴뚝 연기.
// 반딧불 · 연기 · 반짝임 · 빛은 그림에 없고 여기서 그려요. 좌표는 원본 그림(1216×768) 기준이고, 뿌리 컨테이너가 화면 너비에 맞춰 키워요.
// 움직임 값은 모두 tokens.provisional.motion.garden. 모션 줄이기에서는 멈춘 한 장면이에요.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { FRAME } from "../run/layout";
import { canvasTexture } from "../style/gradient";
import { reducedMotion } from "../style/motion";

const G = tokens.provisional.motion.garden;
const DIR = "assets/stages/main";
const KEY = { sky: "garden:sky", ground: "garden:ground", tree: "garden:tree", cloud: "garden:cloud", leaves: "garden:leaves", layers: "garden:layers", dot: "garden:dot" } as const;
const TAU = Math.PI * 2;
/** 나무를 가로로 자르는 마디 수 (마디마다 옆으로 밀어요) */
const SEGMENTS = 24;
/** 빛 점 텍스처의 반지름 */
const DOT = 32;

interface Layers {
  source: { w: number; h: number };
  scale: number;
  /** clumps: 잎 덩어리 (x · y · r: 그림 좌표의 가운데와 반지름, u: leaves 그림에서의 가로 자리) */
  tree: { x: number; y: number; w: number; h: number; pin: number; clumps?: { x: number; y: number; r: number; u: number }[] };
  stars: [number, number][];
  chimney: { x: number; y: number };
  lights: { x: number; y: number; r: number }[];
  meadow: { top: number; bottom: number };
  colors: { star: number; light: number; smoke: number; fireflyA: number; fireflyB: number; fireflyCore: number };
}

export function preloadGarden(scene: Phaser.Scene) {
  for (const k of ["sky", "ground", "tree", "cloud", "leaves"] as const) {
    if (!scene.textures.exists(KEY[k])) scene.load.image(KEY[k], `${DIR}/${k}.webp`);
  }
  if (!scene.cache.json.exists(KEY.layers)) scene.load.json(KEY.layers, `${DIR}/layers.json`);
}

/** 씨앗 하나로 늘 같은 0~1 (반딧불 · 별마다 다른 값) */
function rnd(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 바람: 느린 물결 둘 + 가끔 돌풍 */
function windAt(t: number) {
  const W = G.wind;
  const p = (t / W.gustEvery) % 1;
  const len = W.gustLength / W.gustEvery;
  const gust = p >= 0 && p < len ? Math.sin((p / len) * Math.PI) : 0;
  return Math.sin((t * TAU) / W.slow) * W.slowWeight + Math.sin((t * TAU) / W.slower + 1.3) * W.slowerWeight + gust * W.gust;
}

export interface Garden {
  root: Phaser.GameObjects.Container;
  /** 장면의 update에서 불러요 (time: ms) */
  update(time: number): void;
}

/** 그림을 못 불렀으면 undefined (부르는 쪽이 민무늬 바탕을 그려요) */
export function createGarden(scene: Phaser.Scene): Garden | undefined {
  const L = scene.cache.json.get(KEY.layers) as Layers | undefined;
  if (!L || !["sky", "ground", "tree"].every((k) => scene.textures.exists(KEY[k as "sky"]))) return undefined;

  const unit = FRAME.w / L.source.w;
  const root = scene.add.container(0, (FRAME.h - L.source.h * unit) / 2).setScale(unit);
  const art = 1 / L.scale;
  const dot = canvasTexture(scene, KEY.dot, DOT * 2, DOT * 2, (ctx) => {
    const g = ctx.createRadialGradient(DOT, DOT, 0, DOT, DOT, DOT);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DOT * 2, DOT * 2);
  });
  const glow = (color: number) => scene.add.image(0, 0, dot).setTint(color).setBlendMode(Phaser.BlendModes.ADD);

  // 하늘: 흐르는 폭만큼 넉넉히 키워 가장자리가 안 보이게
  const grow = (L.source.w + G.sky.drift * 3) / L.source.w;
  const sky = scene.add.image(L.source.w / 2, L.source.h / 2, KEY.sky).setScale(art * grow);
  const stars = L.stars.map(([x, y]) => glow(L.colors.star).setPosition(lerp(L.source.w / 2, x, grow), lerp(L.source.h / 2, y, grow)).setDisplaySize(G.star.size, G.star.size));
  const starBox = scene.add.container(0, 0, stars);

  const clouds = scene.textures.exists(KEY.cloud)
    ? [
        scene.add.image(0, G.cloud.y, KEY.cloud).setOrigin(0, 0).setAlpha(G.cloud.alpha),
        scene.add.image(0, G.cloud.farY, KEY.cloud).setOrigin(0, 0).setAlpha(G.cloud.farAlpha).setScale(G.cloud.farScale),
      ]
    : [];

  // 나무: 세로 로프. 고정선(pin) 아래 마디는 움직이지 않아요
  const T = L.tree;
  const points = Array.from({ length: SEGMENTS + 1 }, (_, i) => new Phaser.Math.Vector2(0, (i / SEGMENTS) * T.h * L.scale));
  const tree = scene.add.rope(T.x + T.w / 2, T.y, KEY.tree, undefined, points, false).setScale(art);

  // 잎 덩어리: 나무 그림에서 둥글게 뜬 조각을 나무 위에 얹어요. 나무를 따라가면서 저마다 조금 늦게, 조금 더 흔들려요
  const leaves = scene.textures.exists(KEY.leaves) ? scene.textures.get(KEY.leaves) : undefined;
  const clumps = (leaves ? (T.clumps ?? []) : []).map((c, i) => {
    const side = c.r * 2 * L.scale;
    leaves!.add(i, 0, c.u * L.scale, 0, side, side);
    return { ...c, i, up: Math.max(0, 1 - (c.y - T.y) / T.pin), img: scene.add.image(c.x, c.y, KEY.leaves, i).setScale(art) };
  });

  const ground = scene.add.image(0, 0, KEY.ground).setOrigin(0, 0).setScale(art);
  const lights = L.lights.map((l) => glow(L.colors.light).setPosition(l.x, l.y).setDisplaySize(l.r * 2, l.r * 2));

  const F = G.firefly;
  const flies = Array.from({ length: F.count }, (_, i) => {
    const depth = Math.pow(rnd(i + 99), 1.4);
    const hue = rnd(i + 101);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(L.colors.fireflyA), Phaser.Display.Color.ValueToColor(L.colors.fireflyB), 100, hue * 100);
    return {
      i, depth,
      x: rnd(i) * L.source.w,
      y: lerp(L.meadow.top, L.meadow.bottom, depth),
      phase: rnd(i + 7) * TAU,
      size: lerp(F.sizeMin, F.sizeMax, rnd(i + 61)) * lerp(F.farScale, F.nearScale, depth),
      halo: glow(Phaser.Display.Color.GetColor(color.r, color.g, color.b)),
      core: scene.add.image(0, 0, dot).setTint(L.colors.fireflyCore).setBlendMode(Phaser.BlendModes.ADD),
    };
  });

  const S = G.smoke;
  const puffs = Array.from({ length: S.count }, (_, i) => ({ offset: i / S.count, img: scene.add.image(0, 0, dot).setTint(L.colors.smoke) }));

  root.add([sky, starBox, ...clouds, tree, ...clumps.map((c) => c.img), ground, ...lights, ...flies.flatMap((f) => [f.halo, f.core]), ...puffs.map((p) => p.img)]);

  const still = reducedMotion();
  const update = (time: number) => {
    const t = still ? 0 : time / 1000;
    const sx = Math.sin((t * TAU) / G.sky.period) * G.sky.drift;
    sky.x = L.source.w / 2 + sx;
    starBox.x = sx;
    stars.forEach((s, i) => {
      const a = 0.5 + 0.5 * Math.sin((t * TAU) / lerp(G.star.fastest, G.star.slowest, rnd(i)) + rnd(i + 5) * TAU);
      s.setAlpha(a * a * G.star.alpha);
    });
    clouds.forEach((c, i) => {
      const span = L.source.w + c.displayWidth;
      c.x = ((t * (i ? G.cloud.farSpeed : G.cloud.speed) + i * span * 0.6 + span * 0.35) % span) - c.displayWidth;
    });
    points.forEach((p, i) => {
      const u = Math.max(0, 1 - (p.y / L.scale) / T.pin);
      p.x = windAt(t - u * G.tree.lag) * G.tree.sway * Math.pow(u, G.tree.curve) * L.scale;
    });
    tree.setDirty();
    for (const c of clumps) {
      const { i } = c;
      const own = windAt(t - c.up * G.tree.lag - lerp(0.3, 1, rnd(i + 17)) * G.tree.clumpLag);
      const flutter = Math.sin((t * TAU) / lerp(G.tree.flutterPeriod * 0.6, G.tree.flutterPeriod, rnd(i + 27)) + rnd(i + 37) * TAU) * G.tree.flutter * Math.min(1, Math.abs(own));
      const amount = lerp(0.6, 1.4, rnd(i + 47));
      c.img
        .setPosition(
          c.x + windAt(t - c.up * G.tree.lag) * G.tree.sway * Math.pow(c.up, G.tree.curve) + own * G.tree.clumpSway * amount + flutter,
          c.y + Math.sin((t * TAU) / G.wind.slow + rnd(i + 57) * TAU) * G.tree.clumpLift * amount,
        )
        .setRotation(Phaser.Math.DegToRad(own * G.tree.clumpTurn * amount));
    }
    lights.forEach((l, i) => l.setAlpha(G.light.alpha + G.light.flicker * Math.sin(t * G.light.flickerSpeed * (1 + i / 3) + i) + G.light.jitter * Math.sin(t * G.light.jitterSpeed + i * 2)));
    for (const f of flies) {
      const { i } = f;
      const w1 = lerp(0.11, 0.33, rnd(i + 71));
      const w2 = lerp(0.31, 0.81, rnd(i + 81));
      const x = f.x + Math.sin(t * w1 + f.phase) * lerp(F.roam * 0.28, F.roam, rnd(i + 91)) + Math.sin(t * w2 + f.phase * 2.3) * lerp(4, 14, rnd(i + 13));
      const y = f.y + Math.cos(t * w1 * 0.8 + f.phase * 1.7) * lerp(8, 26, rnd(i + 23)) + Math.sin(t * w2 * 1.3 + f.phase) * 3;
      // 한동안 꺼졌다가 천천히 밝아지고 조금 빨리 꺼져요
      const period = lerp(F.periodMin, F.periodMax, rnd(i + 41));
      const on = lerp(F.onMin, F.onMax, rnd(i + 51));
      const ph = still ? on * 0.6 : (t / period + rnd(i + 3)) % 1;
      let b = 0;
      if (ph < on) {
        const k = ph / on;
        b = k < 0.6 ? Math.sin((k / 0.6) * Math.PI * 0.5) : Math.cos(((k - 0.6) / 0.4) * Math.PI * 0.5);
        b *= b;
      }
      b *= lerp(F.dimmest, 1, rnd(i + 31)) * (0.85 + 0.15 * Math.sin(t * 9 + i));
      const halo = lerp(F.halo * 0.44, F.halo, rnd(i + 111)) * f.size;
      const core = (F.core * 0.7) * f.size + 0.7;
      f.halo.setPosition(x, y).setDisplaySize(halo * 2, halo * 2).setAlpha(b * 0.55);
      f.core.setPosition(x, y).setDisplaySize(core * 2.6, core * 2.2).setAlpha(Math.min(1, b * 1.1));
    }
    for (const p of puffs) {
      const k = still ? p.offset : (t / S.period + p.offset) % 1;
      // 위로 갈수록 옆으로 밀리고, 바람이 불면 조금 더 밀려요
      const push = 1 + windAt(t - k * S.lag) * S.wind;
      const r = lerp(S.start, S.size, k);
      p.img
        .setPosition(L.chimney.x + k * k * S.drift * push + Math.sin(k * 9 + p.offset * S.count) * S.wobble, L.chimney.y - k * S.rise)
        .setDisplaySize(r * 2, r * 2)
        .setAlpha(S.alpha * Math.sin(Math.min(1, k * 6) * Math.PI * 0.5) * (1 - k));
    }
  };
  update(0);
  return { root, update };
}
