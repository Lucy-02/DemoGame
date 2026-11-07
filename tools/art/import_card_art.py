# 고른 카드 일러스트 원본을 게임 에셋으로 만들고 출처 기록을 갱신해요.
# 쓰는 법: python3 tools/art/import_card_art.py <원본 폴더: <case_id>.png + meta.json> [--manifest design/card/art/picks.json]
# 결과: public/assets/cards/<id>.webp (OUT_PX 정사각), assets/provenance.jsonl의 해당 path 줄 교체·추가.
import argparse
import hashlib
import io
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from fit_art import fit  # noqa: E402

OUT_DIR = "public/assets/cards"
OUT_PX = 512
WEBP_QUALITY = 90
PROVENANCE = "assets/provenance.jsonl"
MODEL_NAMES = {"nai-diffusion-4-5-full": "NovelAI Diffusion V4.5 Full"}
HUMAN_WORK = {
    "object": "Lucy가 후보 중 선별(0042). fit_art.py로 물체를 그림 창 가운데로 옮기고 크기를 맞춤(fit_size {size}), 모자란 바탕은 원본 바탕으로 이어 그림. {px}px webp 변환",
    "symbol": "Lucy가 후보 중 선별(0042). fit_art.py로 물체를 그림 창 가운데로 옮기고 크기를 맞춤(fit_size {size}), 모자란 바탕은 원본 바탕으로 이어 그림. {px}px webp 변환",
    "scene": "Lucy가 후보 중 선별(0042). {px}px webp 변환만",
    "backdrop": "Lucy가 후보 중 선별(0042). {px}px webp 변환만",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def build(card: dict, src_dir: str) -> tuple[str, bytes]:
    src = Image.open(os.path.join(src_dir, f"{card['case_id']}.png")).convert("RGB")
    if card["fit_size"] is not None:
        src, _, _ = fit(src, card["fit_size"], out_px=src.width)
    out = src.resize((OUT_PX, OUT_PX), Image.LANCZOS)
    buf = io.BytesIO()
    out.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    return f"assets/cards/{card['id']}.webp", buf.getvalue()


def record(card: dict, path: str, data: bytes, meta: dict) -> dict:
    m = meta[card["case_id"]]
    return {
        "path": path,
        "sha256": sha256(data),
        "status": "placeholder",
        "model": MODEL_NAMES.get(m["model"], m["model"]),
        "prompt_sheet": f"jjal {m['run_id']}",
        "prompt": m["prompt"],
        "negative": m["uc"],
        "seed": m["seed"],
        "settings": {k: m[k] for k in ("width", "height", "steps", "scale", "cfg_rescale", "sampler", "noise_schedule")},
        "source_png": f"jjal {m['source_png']}" if m.get("source_png") else f"jjal runs/{m['run_id']}",
        "source_sha256": m["image_sha256"],
        "human_work": HUMAN_WORK[card["composition"]].format(size=card["fit_size"], px=OUT_PX),
        "note": f"카드 일러스트 {card['name']} ({card['composition']}). 화풍 {m['style_key']} {m['variant']}. 기록 design/card/art/rounds/",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src_dir")
    ap.add_argument("--manifest", default="design/card/art/picks.json")
    a = ap.parse_args()
    cards = json.load(open(a.manifest, encoding="utf-8"))["cards"]
    meta = json.load(open(os.path.join(a.src_dir, "meta.json"), encoding="utf-8"))
    os.makedirs(OUT_DIR, exist_ok=True)
    rows = {}
    for card in cards:
        path, data = build(card, a.src_dir)
        with open(os.path.join("public", path), "wb") as f:
            f.write(data)
        rows[path] = record(card, path, data, meta)
    lines = [ln for ln in open(PROVENANCE, encoding="utf-8").read().splitlines() if ln.strip()]
    kept = [ln for ln in lines if json.loads(ln)["path"] not in rows]
    with open(PROVENANCE, "w", encoding="utf-8") as f:
        for ln in kept + [json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in rows.values()]:
            f.write(ln + "\n")
    print(f"카드 일러스트 {len(rows)}장")


if __name__ == "__main__":
    main()
