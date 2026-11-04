# 정령 일러스트를 게임용 파일로 옮겨요 (Drive jjal-handoff confirmed와 같은 배경 제거본을 2×로 키운 것에서).
# 쓰는 법: python -I tools/art/import-spirits.py <jjal-bgrm 폴더> <2× 폴더 (upscale-2x.py 결과)> <저장소 루트>
# 만드는 것: public/assets/spirits/<정령>/<단계>.webp (알파로 자르고 긴 변 LONG)
#          src/presentation/spiritFrames.json (구도 기준: 성체·각성체는 얼굴 상자, 유체는 보이는 면적, 띠 타일 얼굴 자르기 기본값. 0023)
# 사람 손으로 맞춘 값은 src/presentation/spiritFit.json(피팅 페이지 spirit-fit.html)에 따로 있어서, 다시 돌려도 지워지지 않아요.
# 먼저 tools/art/detect-faces.py로 tools/art/faces.json을 만들어 둬요.
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
# 흰 매트 제거를 할 최소 알파 (이보다 투명하면 계산이 불안정해서 defringe에 맡겨요)
UNMATTE_MIN = 0.06
# 성체·각성체 구도 (0023): 얼굴 상자(tools/art/faces.json, detect-faces.py 결과) 높이로 크기를 맞춰요.
# 띠 타일 얼굴은 얼굴 상자 높이의 TILE_FACE배 정사각, 가운데를 얼굴 높이의 TILE_UP만큼 올려요(머리카락까지)
TILE_FACE = 2.4
TILE_UP = 0.15
# 가로 기준: 얼굴 가운데와, 얼굴 아래 BODY_BAND 얼굴 높이 띠의 몸통 가운데(알파 중앙값)를 BODY_MIX 비율로 섞어요
BODY_BAND = 3
BODY_MIX = 0.5
# 유체는 몸 전체가 띠 타일 얼굴 자리에 들어가요. 정사각으로 채우고 둘레를 이만큼 비워요
BABY_MARGIN = 0.06


def matte_color(png: Path) -> np.ndarray:
    """원본 생성 그림의 배경색 (테두리 4px의 중앙값). 흰 배경이라도 순백이 아니라 밝은 회색이에요."""
    a = np.asarray(Image.open(png).convert("RGB")).astype(np.float32)
    ring = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    return np.median(ring, axis=0)


def unmatte(im: Image.Image, bg: np.ndarray) -> Image.Image:
    """반투명한 곳에 섞인 배경색을 빼서 원래 색을 되살려요 (I = αF + (1-α)B → F = (I - (1-α)B) / α).
    베일·물·머리카락 끝이 어두운 배경 위에서 뿌옇게 뜨는 것을 줄여요. 거의 투명한 곳은 defringe가 맡아요."""
    a = np.asarray(im).astype(np.float32)
    al = a[..., 3:4] / 255
    use = (al > UNMATTE_MIN) & (al < 1)
    fg = (a[..., :3] - (1 - al) * bg) / np.maximum(al, UNMATTE_MIN)
    a[..., :3] = np.where(use, np.clip(fg, 0, 255), a[..., :3])
    return Image.fromarray(a.astype(np.uint8), "RGBA")


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


def meta(png: Path) -> dict:
    info = Image.open(png).info
    c = json.loads(info["Comment"])
    model = info.get("Source", "NovelAI").rsplit(" ", 1)[0]
    keep = ["steps", "scale", "sampler", "noise_schedule", "cfg_rescale", "width", "height"]
    return {"model": model, "prompt": c.get("prompt"), "negative": c.get("uc"), "seed": c.get("seed"),
            "settings": {k: c[k] for k in keep if k in c}}


def main(root: Path, up2x: Path, repo: Path):
    rows = []
    detected = json.loads((repo / "tools/art/faces.json").read_text(encoding="utf-8"))
    frames: dict[str, dict[str, dict]] = {}
    for s in SPIRITS:
        for game, drive in STAGES.items():
            im = Image.open(up2x / f"{s}__{drive}.png").convert("RGBA")
            bg = matte_color(root / "final" / f"{s}__{drive}.png")
            im = defringe(unmatte(im.crop(im.getbbox()), bg))
            W, H = im.size
            body = im.copy()
            body.thumbnail((LONG, LONG), Image.LANCZOS)
            solid = np.asarray(im.getchannel("A")) > 128
            r4 = lambda v: round(float(v), 4)
            if drive == "cub":
                # 보이는 면적의 제곱근(폭 비율)과 무게중심 x로 크기·가로 자리를 맞춰요. 타일 얼굴은 몸 전체
                xs = np.nonzero(solid)[1]
                frame = {"k": "mass", "x": r4(xs.mean() / W), "u": r4(np.sqrt(solid.sum()) / W),
                         "c": [0.5, 0.5, r4(max(W, H) / (1 - 2 * BABY_MARGIN) / H)]}
            else:
                _, x0, y0, x1, y1 = detected[f"{s}/{drive}"]["faces"][0]
                fx, fy, fh = (x0 + x1) / 2 * W, (y0 + y1) / 2 * H, (y1 - y0) * H
                band = solid[int(y0 * H + fh):int(min(H, y0 * H + fh * (1 + BODY_BAND)))]
                cols = np.nonzero(band)[1]
                tx = float(np.median(cols)) if len(cols) else fx
                frame = {"k": "face", "x": r4((fx * (1 - BODY_MIX) + tx * BODY_MIX) / W), "y": r4(fy / H), "u": r4(fh / H),
                         "c": [r4(fx / W), r4((fy - fh * TILE_UP) / H), r4(fh * TILE_FACE / H)]}
            frames.setdefault(s.replace("-", "_"), {})[game] = frame
            out = repo / "public/assets/spirits" / s
            out.mkdir(parents=True, exist_ok=True)
            m = meta(root / "final" / f"{s}__{drive}.png")
            for name, img, work in [(f"{game}.webp", body, f"알파 기준으로 자르고 긴 변 {LONG}로 줄임")]:
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
                                   + f". Claude가 RealESRGAN anime_6B로 2× 업스케일(알파 스냅), 흰 매트 제거(원본 배경색을 반투명한 곳에서 뺌), 바깥 테두리 흰 번짐 색 정리, {work}, webp 변환"),
                    "note": "정령 일러스트 첫 적용. 눈 재생성·색 보정 미실행(Lucy 판정 뒤). 출시 판정 전",
                })
    prov = repo / "assets/provenance.jsonl"
    keep = [l for l in prov.read_text(encoding="utf-8").splitlines() if l.strip() and '"assets/spirits/' not in l]
    prov.write_text("\n".join(keep + [json.dumps(r, ensure_ascii=False) for r in rows]) + "\n", encoding="utf-8", newline="\n")
    lines = [f' "{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in frames.items()]
    (repo / "src/presentation/spiritFrames.json").write_text("{\n" + ",\n".join(lines) + "\n}\n", encoding="utf-8", newline="\n")
    print(f"{len(rows)} files")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]))
