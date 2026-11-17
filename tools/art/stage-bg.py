#!/usr/bin/env python3
"""스테이지 배경 후처리: 원본 PNG(1216x768) → 전투 화면(1280x800) 레이어 두 장.

  python3 tools/art/stage-bg.py <원본.png> <나갈 폴더> --horizon-in 438

하는 일 (결정 0103)
1. 확대 맞춤: 원본의 땅이 시작되는 줄(--horizon-in)이 화면의 유닛 발 줄(--feet, 기본 338) 조금 위에 오게 키우고 잘라요.
2. 흐림: 먼 풍경은 뭉개고 대비·채도를 낮춰요. 땅은 원본을 절반 섞어 덜 뭉개요. 유닛이 주인공이라서요.
3. 레이어 분리: far.webp(먼 풍경, 불투명) + ground.webp(땅, 위쪽이 투명하게 풀림). 겹치면 한 장과 같아요.

그림자는 굽지 않아요. 유닛 자리는 전투마다 달라서 화면이 발밑에 그려요.
"""
import argparse
import os

import cv2
import numpy as np

W, H = 1280, 800


def reframe(img, zoom, horizon_in, horizon_out, cx=0.5):
    h, w = img.shape[:2]
    s = W / w * zoom
    big = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_CUBIC)
    off_y = int(horizon_in * s - horizon_out)
    off_x = int((big.shape[1] - W) * cx)
    off_y = max(0, min(off_y, big.shape[0] - H))
    return big[off_y:off_y + H, off_x:off_x + W].copy()


def soften(img, ground_top):
    sm = img.copy()
    for _ in range(2):
        sm = cv2.bilateralFilter(sm, 9, 40, 40)
    sm = cv2.GaussianBlur(sm, (0, 0), 1.5)
    hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= 0.85
    mean = hsv[..., 2].mean()
    hsv[..., 2] = mean + (hsv[..., 2] - mean) * 0.85
    sm = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
    y = np.arange(H)[:, None, None]
    m = np.clip((y - (ground_top - 40)) / 120, 0, 1) * 0.5
    return (sm * (1 - m) + img * m).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--horizon-in", type=int, required=True, help="원본에서 땅이 시작되는 y")
    ap.add_argument("--feet", type=int, default=338, help="화면의 유닛 발 y")
    ap.add_argument("--split", type=int, default=None, help="화면에서 먼 풍경과 땅을 나누는 y (기본: 자동으로 찾음)")
    ap.add_argument("--feather", type=int, default=24)
    ap.add_argument("--quality", type=int, default=90)
    a = ap.parse_args()

    img = cv2.imread(a.src)
    src_h = img.shape[0]
    base = W / img.shape[1]
    zoom = max((H - a.feet) / (src_h - a.horizon_in) + 0.005, base) / base
    out = soften(reframe(img, zoom, a.horizon_in, a.feet), a.feet - 8)

    split = a.split
    if split is None:
        # 발 줄 위에서 줄 밝기가 가장 크게 바뀌는 곳 = 숲과 땅의 경계
        rows = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32).mean(axis=1)
        d = np.abs(np.diff(cv2.GaussianBlur(rows.reshape(-1, 1), (1, 9), 0).ravel()))
        lo, hi = a.feet - 160, a.feet - 20
        split = int(lo + np.argmax(d[lo:hi]))
    top = split - a.feather // 2

    os.makedirs(a.out, exist_ok=True)
    far = out[: split + a.feather].copy()
    alpha = np.clip((np.arange(H) - top) / a.feather, 0, 1)
    ground = np.dstack([out, np.repeat((alpha * 255).astype(np.uint8)[:, None], W, axis=1)])
    q = [cv2.IMWRITE_WEBP_QUALITY, a.quality]
    cv2.imwrite(os.path.join(a.out, "far.webp"), far, q)
    cv2.imwrite(os.path.join(a.out, "ground.webp"), ground, q)
    print(f"zoom {zoom:.4f}, split y {split}, far {far.shape[1]}x{far.shape[0]}, ground {W}x{H}")


if __name__ == "__main__":
    main()
