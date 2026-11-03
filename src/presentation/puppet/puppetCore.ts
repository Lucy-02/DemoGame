// 정령 퍼핏 평가기: rig.json의 정점을 움직이는 식이에요. 엔진(Phaser)을 몰라요.
// 두 단계로 나뉘어요.
//   signals(dt)  퍼핏 하나에 하나뿐인 신호(각도·호흡·머리 묶음 위상·체인 마디)만 갱신해요. 마리당 수 µs
//   applyCPU()   신호로 모든 정점을 CPU에서 계산해 part.out에 써요. 게임은 GPU 셰이더(puppetRenderer)가 같은 식을 돌려요.
//                이 함수는 검증(골든 테스트)과 셰이더 없는 환경용이에요.
// 평가 순서: 체인 → 날개 회전 → 머리 묶음 흩날림 → 귀 → 머리카락 잔여 → 머리 → 밑단 → 호흡 → 자세 흔들림.
// 리그를 만드는 쪽(빌더)은 jjal 저장소 tools/motion이에요. 포맷: docs/architecture/0002-spirit-puppet.md

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

type Vec2 = [number, number];

/** 체인 프로필(꼬리·베일 등) */
export interface ChainProfile {
  base_deg: number;
  bend_deg: number;
  period: number;
  phase: number;
  second: number;
  period2: number;
}

/** 움직임 프로필. 진폭은 캔버스 px / 도. 정령별 차이는 rig.motion으로 덮어써요. */
export const MOTION_DEFAULTS = {
  head_roll_deg: [1.2, 0.45],
  head_roll_period: [6.2, 3.7],
  breath_period: 5.5,
  breath_inhale_frac: 0.455,
  breath_gain: 2.0,
  breath_hair_lag_s: 0.6,
  breath_hair_gain: 0.3,
  sway_deg: [0.22, 0.08],
  sway_period: [9.3, 4.1],
  hair_wind_deg: [0.45, 0.25, 0.12],
  hair_wind_period: [4.7, 2.3, 1.3],
  hair_stiffness: 18.0,
  hair_damping: 3.6,
  hair_head_coupling: 0.35,
  bundle_gain: 1.3,
  bundle_travel: 0.5,
  bundle_spread: 1.6,
  bundle_axis_spread_deg: 25.0,
  bundle_second: 0.15,
  tail_base_deg: 2.5,
  tail_bend_deg: 9.0,
  tail_period: 5.2,
  tail_phase: 1.1,
  tail_flick_deg: 14.0,
  tail_flick_interval_s: [3.5, 8.0],
  ear_flick_deg: 9.0,
  ear_hold_s: 0.09,
  ear_stiffness: 260.0,
  ear_damping: 14.0,
  ear_interval_s: [2.5, 7.0],
  ear_both_prob: 0.55,
  tail: {} as Partial<ChainProfile>,
  cloth: { base_deg: 2.0, bend_deg: 16.0, period: 4.4, phase: 1.6, second: 0.35, period2: 2.3 } as Partial<ChainProfile>,
  chain_phase_step: 2.1,
  chain_skin_sigma: 1.0,
  hem_px: 10.0,
  hem_period: [5.3, 2.9],
  hem_spread: 0.8,
  wing_tip_deg: 1.4,
  wing_tip_period: 3.6,
  wing_breath_deg: 1.6,
  wing_wave_deg: [1.2, 0.4],
  wing_wave_period: [6.8, 3.1],
  wing_lag_s: 0.35,
};
export type Motion = typeof MOTION_DEFAULTS & Record<string, unknown>;

/** rig.json 레이어 (빌더 출력) */
export interface RigLayer {
  name: string;
  texture: string;
  verts: number[];
  uvs: number[];
  tris: number[];
  head: number[];
  bx: number[];
  by: number[];
  sway: number[];
  earL: number[];
  earR: number[];
  spring: number[];
  hb?: number[];
  hw?: number[];
  hpx?: number[];
  hpy?: number[];
  hp?: number[];
  hn?: number[];
  seg?: number[];
  t?: number[];
  tc?: number[];
  rot?: { pivot: Vec2; sign: number };
  rw?: number[];
  hem?: number[];
  hx?: number[];
}

export interface RigBundle {
  amp: number;
  period: number;
  phase: number;
  period2: number;
  phase2: number;
  bias_deg: number;
  gust_period: number;
  gust_phase: number;
}

export interface RigChain {
  pts: Vec2[];
  profile?: string;
  parent?: number;
  parent_joint?: number;
}

export interface Rig {
  format?: number;
  canvas: Vec2;
  points: {
    head_pivot: Vec2;
    hair_root: Vec2;
    pelvis: Vec2;
    ears?: Partial<Record<"L" | "R", { base: Vec2; outward: number }>>;
  };
  bundles?: Record<string, RigBundle>;
  chains?: RigChain[];
  tail_chain?: Vec2[];
  motion?: Partial<Motion>;
  layers: RigLayer[];
  atlas?: {
    size: Vec2;
    tiers: Record<string, { file: string; size: Vec2 }>;
    png_tiers: Record<string, string>;
  };
}

/** PCG32(XSH RR). 같은 seed면 어느 환경에서도 같은 이벤트(귀 쫑긋·꼬리 튕김) 순서예요. */
export class Pcg32 {
  private state = 0n;
  private readonly inc: bigint;

  constructor(seed: number, seq = 54) {
    this.inc = ((BigInt(seq) << 1n) | 1n) & 0xffffffffffffffffn;
    this.next();
    this.state = (this.state + BigInt(seed)) & 0xffffffffffffffffn;
    this.next();
  }

  next(): number {
    const old = this.state;
    this.state = (old * 6364136223846793005n + this.inc) & 0xffffffffffffffffn;
    const xs = Number((((old >> 18n) ^ old) >> 27n) & 0xffffffffn);
    const rot = Number(old >> 59n);
    return ((xs >>> rot) | (xs << (-rot & 31))) >>> 0;
  }

  randf(): number {
    return this.next() / 4294967296;
  }

  range(a: number, b: number): number {
    return a + (b - a) * this.randf();
  }
}

/** 레이어 하나의 정점 채널 (타입 배열) */
export interface PuppetPart {
  name: string;
  texture: string;
  nv: number;
  base: Float32Array;
  uvs: Float32Array;
  tris: Uint32Array;
  /** applyCPU 결과 (캔버스 px) */
  out: Float32Array;
  head: Float32Array;
  bx: Float32Array;
  by: Float32Array;
  sway: Float32Array;
  earL: Float32Array;
  earR: Float32Array;
  spring: Float32Array;
  hasEars: boolean;
  rot: { px: number; py: number; sign: number } | null;
  rw: Float32Array | null;
  hem: Float32Array | null;
  hx: Float32Array | null;
  /** 머리 묶음 번호(0..) 또는 -1 */
  bi: Int16Array | null;
  hw: Float32Array | null;
  hp: Float32Array | null;
  hn: Float32Array | null;
  hpx: Float32Array | null;
  hpy: Float32Array | null;
  /** 체인: 전역 마디 번호, 마디 안 위치, 그 체인의 [시작, 끝) */
  jSeg: Int32Array | null;
  jT: Float32Array | null;
  jStart: Int32Array | null;
  jEnd: Int32Array | null;
}

/** 퍼핏 전체 신호 (signals 결과, 셰이더 유니폼의 원본) */
export interface PuppetSignals {
  rollRad: number;
  swayRad: number;
  hairRad: number;
  breath: number;
  earL: number;
  earR: number;
  wingRad: number;
  wingTipRad: number;
  hemAmp: number;
  hemW1: number;
  hemW2: number;
  hemSpread: number;
  bTravel: number;
  bSpread: number;
  bSecond: number;
  bAxisSpread: number;
  skinInv2s2: number;
  bPh1: Float32Array;
  bPh2: Float32Array;
  bAmp: Float32Array;
  bCos: Float32Array;
  bSin: Float32Array;
  jNow: Float64Array;
  jBeta: Float64Array;
}

interface Chain {
  rest: Float64Array;
  n: number;
  off: number;
  profile: string;
  parent: number;
  parentJoint: number;
  phase: number;
}

type Bundle = [amp: number, period: number, phase: number, period2: number, phase2: number, bias: number, gustPeriod: number, gustPhase: number];

const f32 = (a: ArrayLike<number>) => Float32Array.from(a);

export interface PuppetOptions {
  seed?: number;
  /** 호흡만 (검증용) */
  breathOnly?: boolean;
  /** 귀 쫑긋·꼬리 튕김 같은 난수 이벤트 끄기 (골든 테스트용) */
  noEvents?: boolean;
}

export class PuppetCore {
  readonly rig: Rig;
  readonly m: Motion;
  readonly parts: PuppetPart[];
  readonly bundles: Bundle[];
  readonly nJoints: number;
  /** 체인 마디 쉬는 자세 (전역 마디 번호 순) */
  readonly jRest: Float64Array;
  readonly sig: PuppetSignals;
  readonly headPivot: Vec2;
  readonly hairRoot: Vec2;
  readonly pelvis: Vec2;
  readonly earBase: Record<"L" | "R", Vec2>;
  t = 0;
  frame = 0;

  private readonly breathOnly: boolean;
  private readonly noEvents: boolean;
  private readonly rng: Pcg32;
  private readonly earOut: Record<"L" | "R", number>;
  private readonly chains: Chain[];
  private prevRoll = 0;
  private hairA = 0;
  private hairV = 0;
  private readonly ear: Record<"L" | "R", [angle: number, vel: number, hold: number]> = { L: [0, 0, 0], R: [0, 0, 0] };
  private earPending: Partial<Record<"L" | "R", number>> = {};
  private earTimer = 0;
  private breathLagged = 0;
  private readonly tailFlick: [angle: number, vel: number, hold: number] = [0, 0, 0];
  private tailFlickTimer = 2.0;
  private wingBreath = 0;

  constructor(rig: Rig, opts: PuppetOptions = {}) {
    this.rig = rig;
    this.m = { ...MOTION_DEFAULTS, ...(rig.motion ?? {}) } as Motion;
    this.breathOnly = !!opts.breathOnly;
    this.noEvents = !!opts.noEvents;
    this.rng = new Pcg32(opts.seed ?? 7);
    const P = rig.points;
    this.headPivot = P.head_pivot;
    this.hairRoot = P.hair_root;
    this.pelvis = P.pelvis;
    const ears = P.ears ?? {};
    this.earBase = { L: ears.L?.base ?? [0, 0], R: ears.R?.base ?? [0, 0] };
    this.earOut = { L: ears.L?.outward ?? 0, R: ears.R?.outward ?? 0 };

    // 머리 묶음: rig의 id를 0.. 조밀한 번호로
    const bkeys = Object.keys(rig.bundles ?? {}).map(Number).sort((a, b) => a - b);
    const bundleIndex = new Map(bkeys.map((k, i) => [k, i]));
    this.bundles = bkeys.map((k) => {
      const b = rig.bundles![String(k)];
      return [b.amp, b.period, b.phase, b.period * b.period2, b.phase2, b.bias_deg * D2R, b.gust_period, b.gust_phase];
    });
    const nb = this.bundles.length;

    // 체인: 모든 체인 마디를 한 표(전역 마디 번호)로 이어 붙여요
    let chains = rig.chains ?? [];
    if (!chains.length && (rig.tail_chain ?? []).length) chains = [{ pts: rig.tail_chain!, profile: "tail" }];
    const count: Record<string, number> = {};
    let off = 0;
    this.chains = chains.map((c) => {
      const prof = c.profile ?? "tail";
      count[prof] = (count[prof] ?? 0) + 1;
      const ch: Chain = {
        rest: Float64Array.from(c.pts.flat()),
        n: c.pts.length,
        off,
        profile: prof,
        parent: c.parent ?? -1,
        parentJoint: c.parent_joint ?? 0,
        phase: (count[prof] - 1) * this.m.chain_phase_step,
      };
      off += ch.n;
      return ch;
    });
    this.nJoints = off;
    this.jRest = new Float64Array(off * 2);
    for (const c of this.chains) this.jRest.set(c.rest, c.off * 2);

    this.sig = {
      rollRad: 0, swayRad: 0, hairRad: 0, breath: 0, earL: 0, earR: 0, wingRad: 0, wingTipRad: 0,
      hemAmp: 0, hemW1: 0, hemW2: 0, hemSpread: 0, bTravel: 0, bSpread: 0, bSecond: 0, bAxisSpread: 0, skinInv2s2: 0,
      bPh1: new Float32Array(nb), bPh2: new Float32Array(nb), bAmp: new Float32Array(nb),
      bCos: Float32Array.from(this.bundles, (b) => Math.cos(b[5])), bSin: Float32Array.from(this.bundles, (b) => Math.sin(b[5])),
      jNow: new Float64Array(off * 2), jBeta: new Float64Array(off),
    };

    this.parts = rig.layers.map((l) => {
      const nv = l.verts.length / 2;
      const ch = (a?: number[]) => (a ? f32(a) : new Float32Array(nv));
      const part: PuppetPart = {
        name: l.name, texture: l.texture, nv, base: f32(l.verts), uvs: f32(l.uvs), tris: Uint32Array.from(l.tris), out: f32(l.verts),
        head: ch(l.head), bx: ch(l.bx), by: ch(l.by), sway: ch(l.sway), earL: ch(l.earL), earR: ch(l.earR), spring: ch(l.spring),
        hasEars: l.earL.some((v) => v > 0) || l.earR.some((v) => v > 0),
        rot: l.rot ? { px: l.rot.pivot[0], py: l.rot.pivot[1], sign: l.rot.sign } : null,
        rw: l.rw ? f32(l.rw) : null, hem: l.hem ? f32(l.hem) : null, hx: l.hx ? f32(l.hx) : null,
        bi: null, hw: null, hp: null, hn: null, hpx: null, hpy: null, jSeg: null, jT: null, jStart: null, jEnd: null,
      };
      if (l.hb) {
        const hw = ch(l.hw);
        part.hw = hw; part.hp = ch(l.hp); part.hn = ch(l.hn); part.hpx = ch(l.hpx); part.hpy = ch(l.hpy);
        part.bi = Int16Array.from(l.hb, (k, i) => (hw[i] > 0 && bundleIndex.has(k) ? bundleIndex.get(k)! : -1));
      }
      if (l.seg && l.t) {
        part.jSeg = new Int32Array(nv); part.jT = f32(l.t); part.jStart = new Int32Array(nv); part.jEnd = new Int32Array(nv);
        for (let i = 0; i < nv; i++) {
          const c = this.chains[l.tc ? l.tc[i] : 0];
          part.jSeg[i] = c.off + l.seg[i]; part.jStart[i] = c.off; part.jEnd[i] = c.off + c.n;
        }
      }
      return part;
    });
    this.scheduleEar();
  }

  /** 고정 간격 한 스텝: 신호 갱신 + CPU 정점 계산 */
  step(delta: number): void {
    this.signals(delta);
    this.applyCPU();
  }

  profile(name: string): ChainProfile {
    const m = this.m;
    const over = (m[name] ?? {}) as Partial<ChainProfile>;
    return { base_deg: m.tail_base_deg, bend_deg: m.tail_bend_deg, period: m.tail_period, phase: m.tail_phase, second: 0, period2: 2.7, ...over };
  }

  private waves(amps: number[], periods: number[], phases: number[]): number {
    let v = 0;
    for (let i = 0; i < amps.length; i++) v += amps[i] * Math.sin((TAU * this.t) / periods[i] + phases[i]);
    return v;
  }

  /** 날숨 끝(0) → 들숨 꼭대기(1) → 날숨 끝(0). 양 끝은 기울기 0 */
  breath01(time: number): number {
    const m = this.m;
    const u = (((time / m.breath_period) % 1) + 1) % 1;
    const fi = m.breath_inhale_frac;
    if (u < fi) return 0.5 - 0.5 * Math.cos((Math.PI * u) / fi);
    return 0.5 + 0.5 * Math.cos((Math.PI * (u - fi)) / (1 - fi));
  }

  /** 퍼핏 전체 신호만 갱신해요(상태 적분 포함). 결과는 this.sig */
  signals(delta: number): PuppetSignals {
    const m = this.m, S = this.sig;
    const dt = Math.min(delta, 1 / 30);
    this.t += delta;
    this.frame += 1;
    const t = this.t;
    const live = this.breathOnly ? 0 : 1;
    const events = !this.breathOnly && !this.noEvents;

    const roll = this.waves(m.head_roll_deg, m.head_roll_period, [0.0, 1.3]) * live;
    S.rollRad = roll * D2R;
    const rollVel = (roll - this.prevRoll) / Math.max(dt, 1e-4);
    this.prevRoll = roll;
    S.breath = this.breath01(t) * m.breath_gain;
    this.breathLagged += (this.breath01(t) - this.breathLagged) * (1 - Math.exp(-dt / m.breath_hair_lag_s));
    const breathHair = 1 + m.breath_hair_gain * (this.breathLagged - 0.5);
    S.swayRad = this.waves(m.sway_deg, m.sway_period, [0.7, 0.0]) * D2R * live;

    // 머리카락 잔여: 바람 + 머리 각속도 반대 방향 관성
    const wind = this.waves(m.hair_wind_deg, m.hair_wind_period, [0.0, 2.1, 0.4]) * live;
    const target = wind - rollVel * m.hair_head_coupling;
    this.hairV += (target - this.hairA) * m.hair_stiffness * dt;
    this.hairV *= Math.exp(-m.hair_damping * dt);
    this.hairA += this.hairV * dt;
    S.hairRad = this.hairA * D2R;

    // 머리 묶음: 묶음마다 주기 두 개·흔들림 축·돌풍이 따로 놀아요
    for (let i = 0; i < this.bundles.length; i++) {
      const b = this.bundles[i];
      const env = 0.6 + 0.4 * Math.sin((TAU * t) / b[6] + b[7]);
      S.bPh1[i] = (TAU * t) / b[1] + b[2];
      S.bPh2[i] = (TAU * t) / b[3] + b[4];
      S.bAmp[i] = b[0] * m.bundle_gain * env * breathHair * live;
    }
    S.bTravel = m.bundle_travel;
    S.bSpread = m.bundle_spread;
    S.bSecond = m.bundle_second;
    S.bAxisSpread = m.bundle_axis_spread_deg * D2R;

    if (events) this.stepEars(dt);
    S.earL = this.ear.L[0] * D2R * this.earOut.L;
    S.earR = this.ear.R[0] * D2R * this.earOut.R;

    // 체인: 뿌리는 거의 고정, 끝쪽 마디로 굽힘이 몰려요. 갈래 체인은 부모 마디를 따라가요
    if (events) this.stepTailFlick(dt);
    const flick = this.tailFlick[0] * D2R;
    const { jNow, jBeta } = S;
    this.chains.forEach((c, ci) => {
      const pr = this.profile(c.profile);
      const n = c.n, rest = c.rest, ph = c.phase, o = c.off;
      const w = (TAU * t) / pr.period + ph;
      const w2 = (TAU * t) / pr.period2 + ph * 1.7;
      const bend = pr.bend_deg * D2R * live;
      let acc = pr.base_deg * D2R * Math.sin(w) * live;
      jNow[2 * o] = rest[0];
      jNow[2 * o + 1] = rest[1];
      if (c.parent >= 0) {
        const p = this.chains[c.parent];
        const pj = p.off + Math.min(c.parentJoint, p.n - 1);
        acc += jBeta[pj];
        jNow[2 * o] = jNow[2 * pj];
        jNow[2 * o + 1] = jNow[2 * pj + 1];
      }
      let norm = 0;
      for (let k = 0; k < n; k++) norm += (k / (n - 1)) ** 2;
      for (let k = 0; k < n; k++) {
        const s = k / (n - 1);
        acc += bend * (s ** 2 / norm) * (Math.sin(w - pr.phase * s) + pr.second * Math.sin(w2 - pr.phase * 1.4 * s));
        if (ci === 0 && c.profile === "tail") acc += ((flick * s ** 6) / n) * 6;
        jBeta[o + k] = acc;
      }
      for (let k = 0; k < n - 1; k++) {
        const dx = rest[2 * k + 2] - rest[2 * k], dy = rest[2 * k + 3] - rest[2 * k + 1];
        const cs = Math.cos(jBeta[o + k]), sn = Math.sin(jBeta[o + k]);
        jNow[2 * (o + k) + 2] = jNow[2 * (o + k)] + dx * cs - dy * sn;
        jNow[2 * (o + k) + 3] = jNow[2 * (o + k) + 1] + dx * sn + dy * cs;
      }
    });
    S.skinInv2s2 = 1 / (2 * m.chain_skin_sigma * m.chain_skin_sigma);

    S.hemW1 = (TAU * t) / m.hem_period[0];
    S.hemW2 = (TAU * t) / m.hem_period[1];
    S.hemAmp = m.hem_px * live;
    S.hemSpread = m.hem_spread;

    // 날개: 지연된 호흡으로 펴지고 느린 파동이 얹혀요
    this.wingBreath += (this.breath01(t) - this.wingBreath) * (1 - Math.exp(-dt / m.wing_lag_s));
    S.wingRad = (m.wing_breath_deg * this.wingBreath + this.waves(m.wing_wave_deg, m.wing_wave_period, [0.3, 1.9]) * live) * D2R;
    S.wingTipRad = m.wing_tip_deg * Math.sin((TAU * t) / m.wing_tip_period + 0.8) * D2R * live;
    return S;
  }

  /** 신호로 모든 정점을 계산해요(CPU). 할당 없이 타입 배열만 써요. */
  applyCPU(): void {
    const S = this.sig, jNow = S.jNow, jBeta = S.jBeta, jRest = this.jRest;
    const [hpx, hpy] = this.headPivot, [hrx, hry] = this.hairRoot, [pvx, pvy] = this.pelvis;
    const [elx, ely] = this.earBase.L, [erx, ery] = this.earBase.R;
    const rc = Math.cos(S.rollRad), rs = Math.sin(S.rollRad);
    const sc = Math.cos(S.swayRad), ss = Math.sin(S.swayRad);
    const breath = S.breath, inv2s2 = S.skinInv2s2;
    for (const p of this.parts) {
      const { base, out, nv, head, bx, by, sway, earL, earR, spring, rw, hem, hx, bi, jSeg, jT, jStart, jEnd } = p;
      for (let i = 0; i < nv; i++) {
        let x = base[2 * i], y = base[2 * i + 1];
        if (jSeg && jT && jStart && jEnd) {
          // 앞뒤 마디를 가우시안으로 섞는 스키닝: 굽은 곳에서 가장 가까운 마디가 바뀌며 메시가 찢어지는 것을 막아요
          const sg = jSeg[i], u = sg + jT[i], j0 = Math.max(sg - 2, jStart[i]), j1 = Math.min(sg + 4, jEnd[i]);
          let ax = 0, ay = 0, aw = 0;
          for (let j = j0; j < j1; j++) {
            const dj = j - u, wj = Math.exp(-dj * dj * inv2s2);
            const rx = x - jRest[2 * j], ry = y - jRest[2 * j + 1];
            const cs = Math.cos(jBeta[j]), sn = Math.sin(jBeta[j]);
            ax += (jNow[2 * j] + rx * cs - ry * sn) * wj;
            ay += (jNow[2 * j + 1] + rx * sn + ry * cs) * wj;
            aw += wj;
          }
          x = ax / aw;
          y = ay / aw;
        }
        if (rw && p.rot) {
          const r = rw[i];
          if (r > 0) {
            const a = (S.wingRad * r + S.wingTipRad * r * r * r) * p.rot.sign;
            const c = Math.cos(a), s = Math.sin(a), dx = x - p.rot.px, dy = y - p.rot.py;
            x = p.rot.px + dx * c - dy * s;
            y = p.rot.py + dx * s + dy * c;
          }
        }
        if (bi && p.hn && p.hp && p.hpx && p.hpy && p.hw) {
          const b = bi[i];
          if (b >= 0) {
            const hn = p.hn[i];
            const lag = S.bTravel * p.hp[i] - S.bSpread * hn;
            const lat = Math.sin(S.bPh1[b] - lag) + S.bSecond * Math.sin(S.bPh2[b] - lag);
            const nx = p.hpx[i], ny = p.hpy[i];
            const ax0 = nx * S.bCos[b] - ny * S.bSin[b], ay0 = nx * S.bSin[b] + ny * S.bCos[b];
            const c = Math.cos(S.bAxisSpread * hn), s = Math.sin(S.bAxisSpread * hn);
            const k = lat * S.bAmp[b] * p.hw[i];
            x += (ax0 * c - ay0 * s) * k;
            y += (ax0 * s + ay0 * c) * k;
          }
        }
        if (p.hasEars) {
          let w = earL[i];
          if (w > 0) {
            const a = S.earL * w, c = Math.cos(a), s = Math.sin(a), dx = x - elx, dy = y - ely;
            x = elx + dx * c - dy * s;
            y = ely + dx * s + dy * c;
          }
          w = earR[i];
          if (w > 0) {
            const a = S.earR * w, c = Math.cos(a), s = Math.sin(a), dx = x - erx, dy = y - ery;
            x = erx + dx * c - dy * s;
            y = ery + dx * s + dy * c;
          }
        }
        const sp = spring[i];
        if (sp > 0) {
          const a = S.hairRad * sp, c = Math.cos(a), s = Math.sin(a), dx = x - hrx, dy = y - hry;
          x = hrx + dx * c - dy * s;
          y = hry + dx * s + dy * c;
        }
        const hw = head[i];
        if (hw > 0) {
          const dx = x - hpx, dy = y - hpy;
          x += (hpx + dx * rc - dy * rs - x) * hw;
          y += (hpy + dx * rs + dy * rc - y) * hw;
        }
        if (hem && hx) {
          const h = hem[i];
          if (h > 0) {
            const q = hx[i] * S.hemSpread;
            x += S.hemAmp * h * (Math.sin(S.hemW1 + q) + 0.3 * Math.sin(S.hemW2 + 1.7 * q + 1.0));
          }
        }
        x += bx[i] * breath;
        y += by[i] * breath;
        const sw = sway[i], dx = x - pvx, dy = y - pvy;
        x += (pvx + dx * sc - dy * ss - x) * sw;
        y += (pvy + dx * ss + dy * sc - y) * sw;
        out[2 * i] = x;
        out[2 * i + 1] = y;
      }
    }
  }

  private scheduleEar(): void {
    const r = this.m.ear_interval_s;
    this.earTimer = this.rng.range(r[0], r[1]);
  }

  private stepEars(dt: number): void {
    const m = this.m;
    this.earTimer -= dt;
    if (this.earTimer <= 0) {
      const both = this.rng.randf() < m.ear_both_prob;
      const first = this.rng.randf() < 0.5 ? "L" : "R";
      this.earPending[first] = 0;
      if (both) this.earPending[first === "L" ? "R" : "L"] = this.rng.range(0.03, 0.08);
      this.scheduleEar();
    }
    for (const k of Object.keys(this.earPending) as ("L" | "R")[]) {
      const left = this.earPending[k]! - dt;
      this.earPending[k] = left;
      if (left <= 0) {
        this.ear[k][2] = m.ear_hold_s * this.rng.range(0.8, 1.2);
        delete this.earPending[k];
      }
    }
    for (const k of ["L", "R"] as const) {
      const st = this.ear[k];
      let target = 0;
      if (st[2] > 0) {
        target = m.ear_flick_deg;
        st[2] -= dt;
      }
      st[1] += (target - st[0]) * m.ear_stiffness * dt;
      st[1] *= Math.exp(-m.ear_damping * dt);
      st[0] += st[1] * dt;
    }
  }

  private stepTailFlick(dt: number): void {
    const m = this.m, f = this.tailFlick;
    this.tailFlickTimer -= dt;
    if (this.tailFlickTimer <= 0) {
      f[2] = this.rng.range(0.12, 0.22);
      this.tailFlickTimer = this.rng.range(m.tail_flick_interval_s[0], m.tail_flick_interval_s[1]);
    }
    let target = 0;
    if (f[2] > 0) {
      target = m.tail_flick_deg;
      f[2] -= dt;
    }
    f[1] += (target - f[0]) * 90 * dt;
    f[1] *= Math.exp(-9 * dt);
    f[0] += f[1] * dt;
  }
}
