# 정령 하나의 후처리 끝난 그림(배경 없는 재묘사본)을 게임 파일로 옮겨요. 임시 선택이든 Lucy 선택이든 정령 하나만 갈아 끼워요(meta.json status가 confirmed면 Lucy 선택).
# 쓰는 법: python -I tools/art/import-spirit-one.py <전달 폴더> <정령 id(fire_fox)> <저장소 루트>
#   전달 폴더: <stage>.rgba.png(baby·adult·awakened, 배경 제거 → 2× → 재묘사 끝난 것), <stage>.orig.png(원본 PNG), meta.json, faces.json
# 만드는 것: public/assets/spirits/<정령>/<단계>.webp (import-spirits.py와 같은 규격), spiritFrames.json의 그 정령 줄,
#          assets/provenance.jsonl의 그 정령 줄 (status placeholder, note에 임시 선택 표시)
# 필요: Pillow, numpy
import hashlib, importlib.util, json, sys
import numpy as np
from pathlib import Path
from PIL import Image


def load_base(repo: Path):
    spec = importlib.util.spec_from_file_location("import_spirits", repo / "tools/art/import-spirits.py")
    base = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(base)
    return base


def main(src: Path, sid: str, repo: Path):
    base = load_base(repo)
    folder = sid.replace("_", "-")
    meta = json.loads((src / "meta.json").read_text(encoding="utf-8"))
    faces = json.loads((src / "faces.json").read_text(encoding="utf-8"))
    r4 = lambda v: round(float(v), 4)
    frames, rows = {}, []
    for stage in ["baby", "adult", "awakened"]:
        full = Image.open(src / f"{stage}.rgba.png").convert("RGBA")
        bbox = full.getbbox()
        im = base.defringe(full.crop(bbox))
        W, H = im.size
        solid = np.asarray(im.getchannel("A")) > 128
        face = faces.get(stage)
        if not face:
            xs = np.nonzero(solid)[1]
            frame = {"k": "mass", "x": r4(xs.mean() / W), "u": r4(np.sqrt(solid.sum()) / W),
                     "c": [0.5, 0.5, r4(max(W, H) / (1 - 2 * base.BABY_MARGIN) / H)]}
        else:
            FW, FH = full.size
            x0, y0, x1, y1 = face["box"]
            # 전체 캔버스 기준 상자를 자른 그림 기준 px로
            fx, fy = (x0 + x1) / 2 * FW - bbox[0], (y0 + y1) / 2 * FH - bbox[1]
            fh = (y1 - y0) * FH
            top = fy - fh / 2
            band = solid[int(top + fh):int(min(H, top + fh * (1 + base.BODY_BAND)))]
            cols = np.nonzero(band)[1]
            tx = float(np.median(cols)) if len(cols) else fx
            frame = {"k": "face", "x": r4((fx * (1 - base.BODY_MIX) + tx * base.BODY_MIX) / W), "y": r4(fy / H), "u": r4(fh / H),
                     "c": [r4(fx / W), r4((fy - fh * base.TILE_UP) / H), r4(fh * base.TILE_FACE / H)]}
        frames[stage] = frame
        body = im.copy()
        body.thumbnail((base.LONG, base.LONG), Image.LANCZOS)
        out = repo / "public/assets/spirits" / folder
        out.mkdir(parents=True, exist_ok=True)
        p = out / f"{stage}.webp"
        body.save(p, "WEBP", quality=86, method=6)
        m = meta["stages"][stage]
        steps = "; ".join(f"{s['step']}: {s.get('method', s.get('to', ''))}" + (f" (denoise {s['denoise']}, 강도 {s['lllite_strength']}, seed {s['seed']})" if s["step"] == "refine" else "")
                          for s in m["postprocess"])
        rows.append({
            "path": f"assets/spirits/{folder}/{stage}.webp",
            "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
            "status": "placeholder",
            "model": "NovelAI Diffusion V4.5 Full",
            "prompt": m["prompt"], "negative": m["negative"], "seed": m["seed"], "settings": m["settings"],
            "prompt_sheet": f"jjal {m['run_id']} ({m['case_id']})",
            "references": None,
            "source_png": f"Lucy 맥 ~/workspace/jjal {meta.get('export_dir', 'exports/fire-fox-ash-final-20261118')}/transfer/{folder}/{stage}.orig.png (sha256 {m['orig_sha256']})",
            "human_work": f"Lucy 생성 라인(잿불 라인 = 기존 라인 형태 + 잿불 색) 위에서 Claude가 후보 생성, Lucy 선택(meta status). 후처리(luddal-win): {steps}. 게임 반입: 알파 기준 자르기, 바깥 테두리 색 정리, 긴 변 {base.LONG} webp",
            "note": (f"Lucy 선택: {meta['status'].split('—', 1)[-1].strip()}" if str(meta.get("status", "")).startswith("confirmed")
                     else "임시 선택 (provisional): Lucy 칸 선택 전. 고르면 같은 명령으로 갈아 끼워요"),
        })
    fj = repo / "src/presentation/spiritFrames.json"
    cur = json.loads(fj.read_text(encoding="utf-8"))
    cur[sid] = frames
    lines = [f' "{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in cur.items()]
    fj.write_text("{\n" + ",\n".join(lines) + "\n}\n", encoding="utf-8", newline="\n")
    prov = repo / "assets/provenance.jsonl"
    keep = [l for l in prov.read_text(encoding="utf-8").splitlines() if l.strip() and f'"assets/spirits/{folder}/' not in l]
    prov.write_text("\n".join(keep + [json.dumps(r, ensure_ascii=False) for r in rows]) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(frames, ensure_ascii=False))


if __name__ == "__main__":
    main(Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]))
