// 정령 퍼핏 미리보기 (개발 서버 전용: pnpm dev:web → /puppet-preview.html?spirit=mist-cat&count=8).
// 게임과 같은 src/presentation/puppet 코드로 그려서, 여기서 본 움직임이 게임 움직임이에요. 화면 배치는 정하지 않아요.
import * as Phaser from "phaser";
import index from "../../public/assets/puppets/index.json";
import { createPuppet, queuePuppet } from "../../src/presentation/puppet/loadPuppet";
import type { PuppetObject } from "../../src/presentation/puppet/puppetRenderer";

const q = new URLSearchParams(location.search);
const ids = (index as { spirits: string[] }).spirits;
const id = q.get("spirit") ?? ids[0];
const count = Number(q.get("count") ?? 1);
const SIZE = 900;

const pick = document.getElementById("spirit") as HTMLSelectElement;
const many = document.getElementById("count") as HTMLSelectElement;
pick.innerHTML = ids.map((s) => `<option${s === id ? " selected" : ""}>${s}</option>`).join("");
many.value = String(count);
const go = () => (location.search = `?spirit=${pick.value}&count=${many.value}`);
pick.onchange = go;
many.onchange = go;

class Preview extends Phaser.Scene {
  private puppets: PuppetObject[] = [];
  private frames = 0;
  private t0 = 0;

  preload() {
    queuePuppet(this, id);
  }

  create() {
    // count마리를 격자로 (동시 표시 확인용)
    const cols = Math.ceil(Math.sqrt(count));
    const cell = SIZE / cols;
    for (let i = 0; i < count; i++) {
      const p = createPuppet(this, id, { seed: 7 + i });
      const [cw, ch] = p.core.rig.canvas;
      const s = Math.min(cell / cw, cell / ch);
      p.setScale(s);
      p.setPosition((i % cols) * cell + (cell - cw * s) / 2, Math.floor(i / cols) * cell + (cell - ch * s) / 2);
      this.puppets.push(p);
    }
    this.t0 = performance.now();
  }

  update() {
    this.frames++;
    const el = (performance.now() - this.t0) / 1000;
    if (el < 0.5) return;
    const src = this.textures.get(`puppet:${id}:atlas`).source[0];
    (document.getElementById("hud") as HTMLElement).textContent =
      `${(this.frames / el).toFixed(0)} fps · 텍스처 ${src.compressionAlgorithm ?? "PNG"} ${src.width}×${src.height}`;
    this.frames = 0;
    this.t0 = performance.now();
  }
}

new Phaser.Game({ type: Phaser.WEBGL, parent: "stage", width: SIZE, height: SIZE, backgroundColor: "#262a38", scene: Preview, banner: false });
