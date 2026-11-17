// 소리 재생 층: 전체 · 음악 · 효과음 세 묶음으로 음량을 나눠요 (0084 1번).
// 브라우저 규칙 때문에 첫 입력 전에는 소리가 나지 않아요. 파일이 없거나 못 읽으면 조용히 넘어가요.
import { AUDIO_BASE, admit, nextVariant, type Bus, type MusicId, type SfxId, type SoundBank } from "./sounds";

export type Volumes = Record<Bus, number>;

export class AudioDirector {
  private ctx: AudioContext;
  private gains: Record<Bus, GainNode>;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private last = new Map<SfxId, number>();
  /** 지금 나고 있는 효과음 (난 순서) */
  private voices: { id: SfxId; source: AudioBufferSourceNode }[] = [];
  private track?: { id: MusicId; gain: GainNode; source?: AudioBufferSourceNode };

  constructor(private bank: SoundBank, private fade: number, private random: () => number = Math.random) {
    this.ctx = new AudioContext();
    const master = this.ctx.createGain();
    master.connect(this.ctx.destination);
    const bus = () => {
      const g = this.ctx.createGain();
      g.connect(master);
      return g;
    };
    this.gains = { master, music: bus(), sfx: bus() };
    // 효과음은 작아서 미리 풀어 둬요. 음악은 틀 때 읽어요
    for (const e of Object.values(bank.sfx)) for (const f of e?.files ?? []) void this.load(`sfx/${f}`);
  }

  /** 첫 입력에 불러요 */
  unlock() {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  /** 창이 가려지면 멈추고, 돌아오면 이어요 */
  setHidden(hidden: boolean) {
    if (hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  setVolume(bus: Bus, value: number) {
    this.gains[bus].gain.value = Math.min(1, Math.max(0, value));
  }

  setVolumes(v: Volumes) {
    for (const bus of ["master", "music", "sfx"] as const) this.setVolume(bus, v[bus]);
  }

  get volumes(): Volumes {
    return { master: this.gains.master.gain.value, music: this.gains.music.gain.value, sfx: this.gains.sfx.gain.value };
  }

  play(id: SfxId) {
    const entry = this.bank.sfx[id];
    const files = entry?.files;
    if (!entry || !files?.length || this.ctx.state !== "running") return;
    const i = nextVariant(files.length, this.last.get(id), this.random);
    this.last.set(id, i);
    void this.load(`sfx/${files[i]}`).then((buffer) => {
      if (!buffer) return;
      // 동시 수를 넘으면 작은 사건부터 빠져요
      const slot = admit(this.voices.map((v) => v.id), id, this.bank.voices);
      if (slot === "skip") return;
      if (slot !== "play") this.voices.splice(slot, 1)[0].source.stop();
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      if (entry.detune) source.detune.value = (this.random() * 2 - 1) * entry.detune;
      const gain = this.ctx.createGain();
      gain.gain.value = Math.min(1, Math.max(0, entry.gain ?? 1));
      source.connect(gain).connect(this.gains.sfx);
      const voice = { id, source };
      this.voices.push(voice);
      source.onended = () => {
        gain.disconnect();
        const i = this.voices.indexOf(voice);
        if (i >= 0) this.voices.splice(i, 1);
      };
      source.start();
    });
  }

  /** 음악을 바꿔요. 같은 곡이면 그대로 이어지고, null이면 멈춰요 */
  music(id: MusicId | null) {
    if (this.track?.id === id) return;
    const now = this.ctx.currentTime;
    const old = this.track;
    if (old) {
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + this.fade);
      old.source?.stop(now + this.fade);
    }
    this.track = undefined;
    const file = id && this.bank.music[id];
    if (!id || !file) return;
    const gain = this.ctx.createGain();
    gain.connect(this.gains.music);
    const track: AudioDirector["track"] = { id, gain };
    this.track = track;
    void this.load(`music/${file}`).then((buffer) => {
      // 읽는 사이에 다른 곡으로 넘어갔으면 틀지 않아요
      if (!buffer || this.track !== track) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      const at = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(1, at + this.fade);
      source.start();
      track.source = source;
    });
  }

  private load(path: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(path);
    if (!p) {
      p = fetch(`${AUDIO_BASE}/${path}`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((data) => this.ctx.decodeAudioData(data))
        .catch(() => null);
      this.buffers.set(path, p);
    }
    return p;
  }
}
