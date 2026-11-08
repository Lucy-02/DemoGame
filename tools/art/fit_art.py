# 카드 일러스트의 물체를 그림 창 가운데에 정해진 크기로 다시 놓아요.
# 쓰는 법: python3 tools/art/fit_art.py <입력> <출력> --size 0.5 [--cy 0.561] [--out-px 1024] [--debug]
#   --size: 물체 크기(bbox 긴 변과 넓이 제곱근의 기하평균)가 출력 그림 한 변에서 차지하는 비율 (긴 변은 --max-side를 넘지 않아요). 카드별 값은 design/card/art/picks.json.
#   --cy:   물체 중심의 세로 위치(그림 높이 비율). 기본값은 손패 창(84×90)에서 톱니(위 11px) 아래 영역의 가운데 = (11+90)/2/90.
# 방식: 테두리 색으로 바탕을 추정해 물체 마스크·bbox를 구하고, 물체가 --size가 되도록 잘라 내거나 넓혀요.
#       넓힐 때 모자라는 바탕은 물체를 뺀 바탕을 정규화 블러로 바깥까지 이어 그린 판으로 채우고, 원본 경계는 부드럽게 섞어요.
import argparse
import sys

import numpy as np
from PIL import Image

HAND_CY = (11 + 90) / 2 / 90


def _box(a, k, axis):
    # 폭 2k+1 상자 평균 (가장자리는 끝값을 이어요)
    pad = [(0, 0)] * a.ndim
    pad[axis] = (k + 1, k)
    c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis, dtype=np.float64)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * k + 1, 2 * k + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return ((hi - lo) / (2 * k + 1)).astype(np.float32)


def blur(a, r):
    """가우시안 근사 (상자 평균 3번)"""
    a = np.asarray(a, np.float32)
    k = max(1, int(round(r * 0.87)))
    for _ in range(3):
        a = _box(_box(a, k, 0), k, 1)
    return a


def object_mask(rgb):
    h, w, _ = rgb.shape
    b = max(4, w // 40)
    border = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3), rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    # 바탕 추정 = 크게 흐린 그림과 테두리 중앙값의 평균 (완만한 그라데이션 바탕에 맞춰요)
    bg = np.stack([blur(rgb[..., i], w / 6) for i in range(3)], -1)
    med = np.median(border, 0)
    bg = 0.5 * bg + 0.5 * med
    d = np.sqrt(((rgb - bg) ** 2).sum(-1))
    spread = np.percentile(np.sqrt(((border - med) ** 2).sum(-1)), 95)
    thr = max(28.0, spread * 1.6)
    m = blur((d > thr).astype(np.float32), 2) > 0.5
    return m


def bbox(m):
    ys, xs = np.nonzero(m)
    if len(xs) < 50:
        return None
    x0, x1 = np.percentile(xs, [1, 99])
    y0, y1 = np.percentile(ys, [1, 99])
    return x0, y0, x1, y1


def object_size(bw, bh):
    """긴 변과 넓이 제곱근의 기하평균. 긴 변만 쓰면 둥근 물체가, 넓이만 쓰면 가늘고 긴 물체가 커 보여요."""
    return np.sqrt(max(bw, bh) * np.sqrt(bw * bh))


def background_plate(canvas, weight, r):
    """weight가 1인 바탕 픽셀만으로 정규화 블러를 해서 바탕을 바깥까지 이어 그려요. 먼 곳은 반경을 넓혀 다시 메워요."""
    plate = np.zeros_like(canvas)
    den = blur(weight, r) + 1e-4
    for i in range(3):
        plate[..., i] = blur(canvas[..., i] * weight, r) / den
    for rr in (r * 2, r * 4):
        den_wide = blur(weight, rr) + 1e-4
        far = den < 0.05
        for i in range(3):
            plate[..., i] = np.where(far, blur(canvas[..., i] * weight, rr) / den_wide, plate[..., i])
        den = np.maximum(den, den_wide)
    return plate


def edge_alpha(h, w, feather):
    """가장자리에서 feather 픽셀 안쪽으로 0 → 1"""
    ys, xs = np.arange(h)[:, None], np.arange(w)[None, :]
    dist = np.minimum(np.minimum(ys, h - 1 - ys), np.minimum(xs, w - 1 - xs))
    return np.clip(dist / feather, 0, 1).astype(np.float32)


def fit(src, size, cy=HAND_CY, cx=0.5, out_px=1024, max_side=0.82):
    rgb = np.asarray(src.convert("RGB"), dtype=np.float32)
    h, w, _ = rgb.shape
    m = object_mask(rgb)
    bb = bbox(m)
    if bb is None:
        raise SystemExit("물체를 못 찾았어요")
    x0, y0, x1, y1 = bb
    bw, bh = x1 - x0, y1 - y0
    crop = max(object_size(bw, bh) / size, max(bw, bh) / max_side)  # 출력 한 변에 해당하는 원본 픽셀 수
    ox = (x0 + x1) / 2 - cx * crop
    oy = (y0 + y1) / 2 - cy * crop
    pad = int(np.ceil(max(0, -ox, -oy, ox + crop - w, oy + crop - h))) + 2

    H, W = h + 2 * pad, w + 2 * pad
    inner = (slice(pad, pad + h), slice(pad, pad + w))
    canvas = np.zeros((H, W, 3), np.float32)
    canvas[inner] = rgb
    weight = np.zeros((H, W), np.float32)
    weight[inner] = (blur(m.astype(np.float32), 12) <= 0.02).astype(np.float32)
    plate = background_plate(canvas, weight, max(8, w / 10))
    alpha = np.zeros((H, W), np.float32)
    alpha[inner] = edge_alpha(h, w, max(12, w / 12))
    comp = canvas * alpha[..., None] + plate * (1 - alpha[..., None])

    im = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8))
    out = im.resize((out_px, out_px), Image.LANCZOS, box=(ox + pad, oy + pad, ox + pad + crop, oy + pad + crop))
    return out, bb, m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--size", type=float, required=True)
    ap.add_argument("--cy", type=float, default=HAND_CY)
    ap.add_argument("--max-side", type=float, default=0.82)
    ap.add_argument("--out-px", type=int, default=1024)
    ap.add_argument("--debug", action="store_true")
    a = ap.parse_args()
    out, bb, m = fit(Image.open(a.src), a.size, a.cy, out_px=a.out_px, max_side=a.max_side)
    out.save(a.dst, quality=90)
    if a.debug:
        Image.fromarray((m * 255).astype(np.uint8)).save(a.dst + ".mask.png")
        print("bbox", [round(v) for v in bb], file=sys.stderr)


if __name__ == "__main__":
    main()
