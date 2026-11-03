// 퍼핏 에셋을 불러오고 게임 오브젝트를 만들어요.
// 에셋: public/assets/puppets/<정령>/rig.json + atlas@2.bc7.ktx(BC7) + atlas@2.png(BC7을 못 쓰는 기기용)
// 아틀라스는 정령당 한 장, 해상도 티어 @2(리그 캔버스의 1/2)만 들어 있어요. 0002 참고.
import * as Phaser from "phaser";
import { PuppetCore, type PuppetOptions, type Rig } from "./puppetCore";
import { PuppetObject, type PuppetTexture } from "./puppetRenderer";

const TIER = "2";

const rigKey = (id: string) => `puppet:${id}`;
const texKey = (id: string) => `puppet:${id}:atlas`;

/** preload에서 불러요. 리그를 읽은 다음 아틀라스를 이어서 큐에 넣어요. */
export function queuePuppet(scene: Phaser.Scene, id: string, baseUrl = "assets/puppets"): void {
  const dir = `${baseUrl}/${id}/`;
  scene.load.json(rigKey(id), `${dir}rig.json`);
  scene.load.once(`filecomplete-json-${rigKey(id)}`, (_key: string, _type: string, rig: Rig) => {
    if (!rig.atlas) throw new Error(`puppet ${id}: rig.json에 atlas가 없어요`);
    const tier = rig.atlas.tiers[TIER];
    const png = rig.atlas.png_tiers[TIER];
    // Phaser는 설정 객체의 키 순서대로 처음 지원되는 형식을 골라요: 압축을 먼저, IMG를 맨 끝에
    scene.load.texture(texKey(id), { BPTC: { type: "KTX", textureURL: dir + tier.file }, IMG: { textureURL: dir + png } });
  });
}

/** 퍼핏 에셋이 다 올라왔는지 */
export function puppetReady(scene: Phaser.Scene, id: string): boolean {
  return scene.cache.json.exists(rigKey(id)) && scene.textures.exists(texKey(id));
}

const loading = new WeakMap<Phaser.Scene, Set<string>>();
/**
 * 화면이 이미 떠 있을 때(create 이후) 필요한 정령만 불러요. 다 올라오면 onReady를 한 번 불러요.
 * 이미 올라와 있으면 true를 돌려주고 아무것도 하지 않아요.
 */
export function ensurePuppet(scene: Phaser.Scene, id: string, onReady: () => void, baseUrl?: string): boolean {
  if (puppetReady(scene, id)) return true;
  const set = loading.get(scene) ?? new Set<string>();
  loading.set(scene, set);
  if (set.has(id)) return false;
  set.add(id);
  queuePuppet(scene, id, baseUrl);
  const done = () => {
    if (!puppetReady(scene, id)) return; // 리그 다음에 아틀라스가 큐에 들어가서 complete가 두 번 와요
    scene.load.off(Phaser.Loader.Events.COMPLETE, done);
    set.delete(id);
    onReady();
  };
  scene.load.on(Phaser.Loader.Events.COMPLETE, done);
  scene.load.start();
  return false;
}

/**
 * create 뒤에 불러요. 같은 정령 여러 마리면 seed를 다르게 줘요(귀·꼬리 이벤트 시각이 달라져요).
 * 화면을 다시 그릴 때 움직임이 처음부터 시작하지 않게 하려면 opts.core에 전에 쓰던 PuppetCore를 넘겨요.
 */
export function createPuppet(scene: Phaser.Scene, id: string, opts: PuppetOptions & { core?: PuppetCore } = {}): PuppetObject {
  const rig = scene.cache.json.get(rigKey(id)) as Rig | undefined;
  if (!rig?.atlas) throw new Error(`puppet ${id}: queuePuppet을 먼저 불러야 해요`);
  const src = scene.textures.get(texKey(id)).source[0];
  const glTex = src.glTexture?.webGLTexture;
  if (!glTex) throw new Error(`puppet ${id}: 아틀라스 텍스처가 GPU에 없어요`);
  const compressed = !!src.compressionAlgorithm;
  if (!compressed) ensureMipmaps(scene, glTex);
  const tex: PuppetTexture = { gl: glTex, logicalSize: rig.atlas.size, flipV: !compressed && src.flipY };
  return new PuppetObject(scene, opts.core ?? new PuppetCore(rig, opts), tex);
}

// PNG 대체본은 Phaser가 밉맵 없이 올려요(게임 설정에 mipmapFilter가 없어서). 작게 그릴 때 깨지지 않게 여기서 만들어요.
// BC7 KTX에는 밉맵이 다 들어 있어요.
const mipped = new WeakSet<WebGLTexture>();
function ensureMipmaps(scene: Phaser.Scene, tex: WebGLTexture): void {
  if (mipped.has(tex)) return;
  const renderer = scene.game.renderer;
  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  const gl = renderer.gl;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
  mipped.add(tex);
}
