// 퍼핏을 그리는 Phaser 게임 오브젝트예요. 정점 변형은 버텍스 셰이더가 해요(GPU).
// 정점 채널은 정적 버퍼에 한 번 올리고, 매 프레임 PuppetCore.signals 결과만 유니폼으로 보내요. 마리당 CPU 몫은 수 µs.
// Phaser 4 Extern 안에서 WebGL을 직접 불러요(Extern이 끝나면 Phaser가 GL 상태를 되돌려요). Mesh2D는 정점을 매 프레임 CPU로
// 다시 변환해서 8마리에서 프레임 11~35 ms가 나와 쓰지 않아요. 측정: docs/architecture/0002-spirit-puppet.md
// 셰이더는 GLSL 100이라 WebGL1(Phaser 기본)·WebGL2 컨텍스트 둘 다에서 돌아요.
// 같은 리그를 쓰는 퍼핏끼리 정적 버퍼·텍스처를 함께 써요. 레이어 순서 고정, 레이어당 드로우 1회, 프리멀티플라이드 알파.
import * as Phaser from "phaser";
import type { PuppetCore } from "./puppetCore";

/** 셰이더 유니폼 배열 크기. 리그가 넘으면 만들 때 오류예요. */
export const MAX_JOINTS = 96;
export const MAX_BUNDLES = 32;

const VS = `
precision highp float;
attribute vec4 a0; // 쉬는 자세 xy, uv(아틀라스 px)
attribute vec4 a1; // head, sway, bx, by
attribute vec4 a2; // earL, earR, spring, rw
attribute vec4 a3; // 머리 묶음 번호(-1 없음), hw, hp, hn
attribute vec4 a4; // hpx, hpy, hem, hx
attribute vec4 a5; // 체인 마디(-1 없음), t, 체인 시작, 체인 끝
uniform mat3 uWorld;  // 퍼핏 캔버스 px -> 화면 px (Phaser calcMatrix)
uniform vec2 uView;   // 그리기 대상 크기(px)
uniform vec2 uTexSize;
uniform float uFlipV; // Phaser가 PNG를 뒤집어 올렸으면 1 (압축 텍스처는 0)
uniform vec4 uJ[${MAX_JOINTS}];  // 마디 변환: cos, sin, tx, ty (p' = R p + t)
uniform vec4 uB[${MAX_BUNDLES}]; // 머리 묶음: 위상1, 위상2, 진폭, 축 기울기
uniform vec4 uG0; // roll, sway, hair, breath
uniform vec4 uG1; // earL, earR, wing, wingTip
uniform vec4 uG2; // hemAmp, hemW1, hemW2, hemSpread
uniform vec4 uG3; // travel, spread, second, axisSpread
uniform vec4 uG4; // 1/(2σ²), 레이어 회전 부호, 레이어 회전 피벗 xy
uniform vec4 uP0; // 머리 피벗, 머리카락 뿌리
uniform vec4 uP1; // 골반, (비움)
uniform vec4 uP2; // 귀 L 뿌리, 귀 R 뿌리
varying vec2 vUv;
vec2 rotA(vec2 p, vec2 c, float a) {
  float cs = cos(a), sn = sin(a);
  vec2 d = p - c;
  return c + vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs);
}
void main() {
  vec2 p = a0.xy;
  if (a5.x >= 0.0) {
    float u = a5.x + a5.y;
    vec2 acc = vec2(0.0);
    float aw = 0.0;
    for (int k = 0; k < 6; k++) {
      float j = a5.x - 2.0 + float(k);
      if (j >= a5.z && j < a5.w) {
        vec4 J = uJ[int(j)];
        float dj = j - u;
        float w = exp(-dj * dj * uG4.x);
        acc += vec2(J.x * p.x - J.y * p.y + J.z, J.y * p.x + J.x * p.y + J.w) * w;
        aw += w;
      }
    }
    p = acc / aw;
  }
  if (a2.w > 0.0) p = rotA(p, uG4.zw, (uG1.z * a2.w + uG1.w * a2.w * a2.w * a2.w) * uG4.y);
  if (a3.x >= 0.0) {
    vec4 B = uB[int(a3.x)];
    float lag = uG3.x * a3.z - uG3.y * a3.w;
    float lat = sin(B.x - lag) + uG3.z * sin(B.y - lag);
    vec2 ax = rotA(rotA(a4.xy, vec2(0.0), B.w), vec2(0.0), uG3.w * a3.w);
    p += ax * (lat * B.z * a3.y);
  }
  if (a2.x > 0.0) p = rotA(p, uP2.xy, uG1.x * a2.x);
  if (a2.y > 0.0) p = rotA(p, uP2.zw, uG1.y * a2.y);
  if (a2.z > 0.0) p = rotA(p, uP0.zw, uG0.z * a2.z);
  if (a1.x > 0.0) p += (rotA(p, uP0.xy, uG0.x) - p) * a1.x;
  if (a4.z > 0.0) {
    float q = a4.w * uG2.w;
    p.x += uG2.x * a4.z * (sin(uG2.y + q) + 0.3 * sin(uG2.z + 1.7 * q + 1.0));
  }
  p += a1.zw * uG0.w;
  p += (rotA(p, uP1.xy, uG0.y) - p) * a1.y;
  vec2 s = (uWorld * vec3(p, 1.0)).xy;
  gl_Position = vec4(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0, 0.0, 1.0);
  vec2 t = a0.zw / uTexSize;
  vUv = vec2(t.x, mix(t.y, 1.0 - t.y, uFlipV));
}`;

const FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uAlpha;
void main() { gl_FragColor = texture2D(uTex, vUv) * uAlpha; }`;

const ATTRS = ["a0", "a1", "a2", "a3", "a4", "a5"] as const;
const UNIFORMS = ["uWorld", "uView", "uTexSize", "uFlipV", "uTex", "uAlpha", "uJ", "uB", "uG0", "uG1", "uG2", "uG3", "uG4", "uP0", "uP1", "uP2"] as const;
type Program = { prog: WebGLProgram; attr: Record<(typeof ATTRS)[number], number>; uni: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null> };

/** 아틀라스 텍스처 (Phaser 텍스처 매니저에 올라간 것) */
export interface PuppetTexture {
  gl: WebGLTexture;
  /** 리그 UV의 기준 크기(@1 논리 크기). 해상도 티어가 달라도 같아요 */
  logicalSize: [number, number];
  flipV: boolean;
}

interface Shared {
  prog: Program;
  layers: { buf: WebGLBuffer; ibo: WebGLBuffer; count: number }[];
}

// 위상이 커지면 float32 셰이더에서 정밀도가 떨어져서 0..2π로 접어 보내요
const wrap = (a: number) => a - Math.floor(a / (Math.PI * 2)) * Math.PI * 2;
const shared = new WeakMap<object, Shared>();

function compile(gl: WebGLRenderingContext): Program {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`puppet shader: ${gl.getShaderInfoLog(sh)}`);
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, make(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, make(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`puppet program: ${gl.getProgramInfoLog(prog)}`);
  const attr = Object.fromEntries(ATTRS.map((a) => [a, gl.getAttribLocation(prog, a)])) as Program["attr"];
  const uni = Object.fromEntries(UNIFORMS.map((u) => [u, gl.getUniformLocation(prog, u)])) as Program["uni"];
  return { prog, attr, uni };
}

function sharedFor(gl: WebGLRenderingContext, core: PuppetCore): Shared {
  const hit = shared.get(core.rig);
  if (hit) return hit;
  if (core.nJoints > MAX_JOINTS || core.bundles.length > MAX_BUNDLES) {
    throw new Error(`puppet rig exceeds shader limits: joints ${core.nJoints}/${MAX_JOINTS}, bundles ${core.bundles.length}/${MAX_BUNDLES}`);
  }
  const layers = core.parts.map((p) => {
    if (p.nv > 65535) throw new Error(`puppet layer ${p.name}: ${p.nv} verts > Uint16`);
    // 정적 채널 6 vec4를 한 버퍼에 교차 배치
    const v = new Float32Array(p.nv * 24);
    for (let i = 0; i < p.nv; i++) {
      v.set([
        p.base[2 * i], p.base[2 * i + 1], p.uvs[2 * i], p.uvs[2 * i + 1],
        p.head[i], p.sway[i], p.bx[i], p.by[i],
        p.earL[i], p.earR[i], p.spring[i], p.rw ? p.rw[i] : 0,
        p.bi ? p.bi[i] : -1, p.hw ? p.hw[i] : 0, p.hp ? p.hp[i] : 0, p.hn ? p.hn[i] : 0,
        p.hpx ? p.hpx[i] : 0, p.hpy ? p.hpy[i] : 0, p.hem ? p.hem[i] : 0, p.hx ? p.hx[i] : 0,
        p.jSeg ? p.jSeg[i] : -1, p.jT ? p.jT[i] : 0, p.jStart ? p.jStart[i] : 0, p.jEnd ? p.jEnd[i] : 0,
      ], i * 24);
    }
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    const ibo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(p.tris), gl.STATIC_DRAW);
    return { buf, ibo, count: p.tris.length };
  });
  const s = { prog: compile(gl), layers };
  shared.set(core.rig, s);
  return s;
}

/** Phaser가 WebGL1에도 붙여 주는 VAO 함수 (WebGL2는 원래 있음) */
type VaoGL = WebGLRenderingContext & {
  createVertexArray(): WebGLVertexArrayObject;
  bindVertexArray(vao: WebGLVertexArrayObject | null): void;
};

export class PuppetObject extends Phaser.GameObjects.Extern {
  readonly core: PuppetCore;
  /** 고정 스텝(초). 화면 갱신률과 상관없이 같은 움직임 */
  fixedDt = 1 / 60;
  /** false면 밖에서 advance를 불러요(캡처·테스트) */
  autoStep = true;
  private readonly tex: PuppetTexture;
  private res: Shared | null = null;
  private vaos: WebGLVertexArrayObject[] = [];
  private acc = 0;
  private readonly uJ = new Float32Array(MAX_JOINTS * 4);
  private readonly uB = new Float32Array(MAX_BUNDLES * 4);

  constructor(scene: Phaser.Scene, core: PuppetCore, tex: PuppetTexture) {
    super(scene);
    this.core = core;
    this.tex = tex;
    scene.add.existing(this);
  }

  advance(dt: number): void {
    this.core.signals(dt);
  }

  preUpdate(_time: number, delta: number): void {
    if (!this.autoStep) return;
    this.acc += Math.min(delta / 1000, 0.25);
    while (this.acc >= this.fixedDt) {
      this.advance(this.fixedDt);
      this.acc -= this.fixedDt;
    }
  }

  private init(gl: VaoGL): void {
    this.res = sharedFor(gl, this.core);
    const { attr } = this.res.prog;
    this.vaos = this.res.layers.map((L) => {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, L.buf);
      ATTRS.forEach((a, k) => {
        gl.enableVertexAttribArray(attr[a]);
        gl.vertexAttribPointer(attr[a], 4, gl.FLOAT, false, 96, k * 16);
      });
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, L.ibo);
      gl.bindVertexArray(null);
      return vao;
    });
  }

  private upload(gl: WebGLRenderingContext, u: Program["uni"]): void {
    const c = this.core, S = c.sig;
    for (let j = 0; j < c.nJoints; j++) {
      const cs = Math.cos(S.jBeta[j]), sn = Math.sin(S.jBeta[j]), rx = c.jRest[2 * j], ry = c.jRest[2 * j + 1];
      this.uJ[4 * j] = cs;
      this.uJ[4 * j + 1] = sn;
      this.uJ[4 * j + 2] = S.jNow[2 * j] - (rx * cs - ry * sn);
      this.uJ[4 * j + 3] = S.jNow[2 * j + 1] - (rx * sn + ry * cs);
    }
    for (let b = 0; b < c.bundles.length; b++) {
      this.uB[4 * b] = wrap(S.bPh1[b]);
      this.uB[4 * b + 1] = wrap(S.bPh2[b]);
      this.uB[4 * b + 2] = S.bAmp[b];
      this.uB[4 * b + 3] = c.bundles[b][5];
    }
    gl.uniform4fv(u.uJ, this.uJ);
    gl.uniform4fv(u.uB, this.uB);
    gl.uniform4f(u.uG0, S.rollRad, S.swayRad, S.hairRad, S.breath);
    gl.uniform4f(u.uG1, S.earL, S.earR, S.wingRad, S.wingTipRad);
    gl.uniform4f(u.uG2, S.hemAmp, wrap(S.hemW1), wrap(S.hemW2), S.hemSpread);
    gl.uniform4f(u.uG3, S.bTravel, S.bSpread, S.bSecond, S.bAxisSpread);
    gl.uniform4f(u.uP0, c.headPivot[0], c.headPivot[1], c.hairRoot[0], c.hairRoot[1]);
    gl.uniform4f(u.uP1, c.pelvis[0], c.pelvis[1], 0, 0);
    gl.uniform4f(u.uP2, c.earBase.L[0], c.earBase.L[1], c.earBase.R[0], c.earBase.R[1]);
  }

  render(renderer: Phaser.Renderer.WebGL.WebGLRenderer, drawingContext: Phaser.Renderer.WebGL.DrawingContext, calcMatrix: Phaser.GameObjects.Components.TransformMatrix): void {
    const gl = renderer.gl as VaoGL;
    renderer.glWrapper.updateBindingsFramebuffer({ bindings: { framebuffer: drawingContext.framebuffer } }, true);
    if (!this.res) this.init(gl);
    const { prog, uni } = this.res!.prog;
    const m = calcMatrix;
    gl.viewport(0, 0, drawingContext.width, drawingContext.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.uniformMatrix3fv(uni.uWorld, false, [m.a, m.b, 0, m.c, m.d, 0, m.e, m.f, 1]);
    gl.uniform2f(uni.uView, drawingContext.width, drawingContext.height);
    gl.uniform2f(uni.uTexSize, this.tex.logicalSize[0], this.tex.logicalSize[1]);
    gl.uniform1f(uni.uFlipV, this.tex.flipV ? 1 : 0);
    gl.uniform1i(uni.uTex, 0);
    gl.uniform1f(uni.uAlpha, this.alpha);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex.gl);
    this.upload(gl, uni);
    this.core.parts.forEach((p, li) => {
      gl.bindVertexArray(this.vaos[li]);
      gl.uniform4f(uni.uG4, this.core.sig.skinInv2s2, p.rot ? p.rot.sign : 0, p.rot ? p.rot.px : 0, p.rot ? p.rot.py : 0);
      gl.drawElements(gl.TRIANGLES, this.res!.layers[li].count, gl.UNSIGNED_SHORT, 0);
    });
    gl.bindVertexArray(null);
  }
}
