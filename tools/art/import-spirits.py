# 정령 일러스트를 게임용 파일로 옮겨요 (Drive jjal-handoff confirmed와 같은 배경 제거본을 2×로 키운 것에서).
# 쓰는 법: python -I tools/art/import-spirits.py <jjal-bgrm 폴더> <2× 폴더 (upscale-2x.py 결과)> <저장소 루트>
# 만드는 것: public/assets/spirits/<정령>/<단계>.webp (알파로 자르고 긴 변 LONG)
#          public/assets/spirits/<정령>/<단계>-face.webp (128 정사각, 띠 타일 원형 얼굴용)
#          src/presentation/spiritFrames.json (성체·각성체 얼굴 자리. 화면이 상반신 구도를 잡는 데 써요)
# 그리고 assets/provenance.jsonl에 파일마다 한 줄 (원본 PNG의 NovelAI 메타데이터에서).
# 필요: Pillow, numpy
import hashlib, json, sys
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter

SPIRITS = ["flash", "glass-salamander", "kelp-seahorse", "magma-ibex", "mirage", "mirror-peacock", "mist-cat",
           "night-owl", "pearl-oyster", "prism-chameleon", "rain-frog", "river-otter", "rune", "shadow-moth"]
# 게임 단계 이름 ← Drive 파일 단계 이름
STAGES = {"baby": "cub", "adult": "adult", "awakened": "awakened"}
LONG = 1536
# 테두리 색 정리 폭 (2× 원본 px)
EDGE = 2
FACE = 128
# 성체·각성체 얼굴 자리: (가운데 x, 가운데 y: 자른 그림 폭·높이 비율, 지름: 긴 변 비율). 눈으로 맞춘 값이에요.
FACES = {
    "flash/adult": (0.33, 0.11, 0.153),
    "flash/awakened": (0.28, 0.21, 0.153),
    "glass-salamander/adult": (0.47, 0.1, 0.17),
    "glass-salamander/awakened": (0.54, 0.17, 0.17),
    "kelp-seahorse/adult": (0.47, 0.09, 0.153),
    "kelp-seahorse/awakened": (0.58, 0.23, 0.119),
    "magma-ibex/adult": (0.44, 0.12, 0.153),
    "magma-ibex/awakened": (0.47, 0.25, 0.136),
    "mirage/adult": (0.51, 0.07, 0.119),
    "mirage/awakened": (0.5, 0.08, 0.119),
    "mirror-peacock/adult": (0.53, 0.14, 0.102),
    "mirror-peacock/awakened": (0.53, 0.23, 0.102),
    "mist-cat/adult": (0.47, 0.22, 0.204),
    "mist-cat/awakened": (0.71, 0.15, 0.17),
    "night-owl/adult": (0.46, 0.11, 0.119),
    "night-owl/awakened": (0.52, 0.19, 0.136),
    "pearl-oyster/adult": (0.55, 0.17, 0.119),
    "pearl-oyster/awakened": (0.55, 0.19, 0.102),
    "prism-chameleon/adult": (0.36, 0.22, 0.136),
    "prism-chameleon/awakened": (0.4, 0.09, 0.136),
    "rain-frog/adult": (0.37, 0.08, 0.136),
    "rain-frog/awakened": (0.53, 0.19, 0.136),
    "river-otter/adult": (0.47, 0.11, 0.136),
    "river-otter/awakened": (0.51, 0.09, 0.136),
    "rune/adult": (0.41, 0.14, 0.136),
    "rune/awakened": (0.55, 0.2, 0.136),
    "shadow-moth/adult": (0.38, 0.13, 0.187),
    "shadow-moth/awakened": (0.37, 0.19, 0.17),
}
# 유체는 몸 전체가 얼굴 자리에 들어가요. 정사각으로 채우고 둘레를 이만큼 비워요
BABY_MARGIN = 0.06




def defringe(im: Image.Image) -> Image.Image:
    """바깥 테두리(투명한 곳에서 EDGE px 안)의 색을 안쪽 불투명한 색으로 바꿔요. 원래 흰 배경이 번진 밝은 선을 지워요.
    반투명한 천처럼 바깥 테두리가 아닌 곳은 그대로 둬요."""
    a = np.asarray(im).astype(np.float32)
    alpha = a[..., 3]
    clear = Image.fromarray(((alpha < 10) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(EDGE * 2 + 1))
    band = (np.asarray(clear) > 0) & (alpha >= 10)
    solid = (alpha >= 250).astype(np.float32)
    blur = ImageFilter.GaussianBlur(EDGE * 2)
    def soft(x: np.ndarray) -> np.ndarray:
        return np.asarray(Image.fromarray(x.astype(np.uint8)).filter(blur)).astype(np.float32)
    den = soft(solid * 255) / 255
    inner = np.stack([soft(a[..., i] * solid) for i in range(3)], -1) / np.maximum(den, 1e-4)[..., None]
    use = band & (den > 0.05)
    a[..., :3][use] = inner[use]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def square(im: Image.Image, cx: float, cy: float, d: float) -> Image.Image:
    out = Image.new("RGBA", (round(d), round(d)), (0, 0, 0, 0))
    out.paste(im, (round(d / 2 - cx), round(d / 2 - cy)), im)
    return out.resize((FACE, FACE), Image.LANCZOS)


def meta(png: Path) -> dict:
    info = Image.open(png).info
    c = json.loads(info["Comment"])
    model = info.get("Source", "NovelAI").rsplit(" ", 1)[0]
    keep = ["steps", "scale", "sampler", "noise_schedule", "cfg_rescale", "width", "height"]
    return {"model": model, "prompt": c.get("prompt"), "negative": c.get("uc"), "seed": c.get("seed"),
            "settings": {k: c[k] for k in keep if k in c}}


def main(root: Path, up2x: Path, repo: Path):
    rows = []
    frames: dict[str, dict[str, tuple]] = {}
    for s in SPIRITS:
        for game, drive in STAGES.items():
            im = Image.open(up2x / f"{s}__{drive}.png").convert("RGBA")
            im = defringe(im.crop(im.getbbox()))
            body = im.copy()
            body.thumbnail((LONG, LONG), Image.LANCZOS)
            if drive == "cub":
                d = max(im.size) / (1 - 2 * BABY_MARGIN)
                face = square(im, im.width / 2, im.height / 2, d)
                how = "몸 전체를 정사각으로"
            else:
                fx, fy, fd = FACES[f"{s}/{drive}"]
                face = square(im, fx * im.width, fy * im.height, fd * max(im.size))
                how = f"얼굴 자리 {fx}, {fy}, 지름 {fd}"
                frames.setdefault(s.replace("-", "_"), {})[game] = (fx, fy, fd)
            out = repo / "public/assets/spirits" / s
            out.mkdir(parents=True, exist_ok=True)
            m = meta(root / "final" / f"{s}__{drive}.png")
            for name, img, work in [(f"{game}.webp", body, f"알파 기준으로 자르고 긴 변 {LONG}로 줄임"),
                                    (f"{game}-face.webp", face, f"얼굴 원형용 {FACE} 정사각 ({how})")]:
                p = out / name
                img.save(p, "WEBP", quality=86, method=6)
                rows.append({
                    "path": f"assets/spirits/{s}/{name}",
                    "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
                    "status": "placeholder", **m,
                    "prompt_sheet": None,
                    "references": None,
                    "source_png": f"Drive jjal-handoff legacy/confirmed-raw-20261102 ({s} {drive})",
                    "human_work": ("Lucy 생성·선별·확정 (confirmed). 배경 제거 "
                                   + ("lucida+vitmatte" if (s, drive) == ("night-owl", "awakened") else "hybrid+vitmatte")
                                   + f". Claude가 RealESRGAN anime_6B로 2× 업스케일(알파 스냅), 바깥 테두리 흰 번짐 색 정리, {work}, webp 변환"),
                    "note": "정령 일러스트 첫 적용. 눈 재생성·색 보정 미실행(Lucy 판정 뒤). 출시 판정 전",
                })
    prov = repo / "assets/provenance.jsonl"
    keep = [l for l in prov.read_text(encoding="utf-8").splitlines() if l.strip() and '"assets/spirits/' not in l]
    prov.write_text("\n".join(keep + [json.dumps(r, ensure_ascii=False) for r in rows]) + "\n", encoding="utf-8", newline="\n")
    (repo / "src/presentation/spiritFrames.json").write_text(
        json.dumps(frames, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(rows)} files")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]))
