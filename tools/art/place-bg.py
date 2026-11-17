#!/usr/bin/env python3
"""장소 배경 후처리: 원본 PNG(1216x768, 또는 그 2배) → 화면 한 장(1280x800의 --scale 배, webp).

  python3 tools/art/place-bg.py <원본.png> <나갈 파일.webp>

레이어를 나누지 않아요. 유닛이 서지 않고 화면이 창 뒤 덮개로 누르는 자리(상점, 0122)에 써요.
화면을 꽉 채우게 키우고 가운데를 잘라요.
"""
import argparse
import os

import cv2

W, H = 1280, 800


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--quality", type=int, default=90)
    ap.add_argument("--scale", type=int, default=1, help="나갈 그림의 배수 (0149)")
    a = ap.parse_args()
    global W, H
    W, H = W * a.scale, H * a.scale

    img = cv2.imread(a.src)
    s = max(W / img.shape[1], H / img.shape[0])
    big = cv2.resize(img, (round(img.shape[1] * s), round(img.shape[0] * s)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    x, y = (big.shape[1] - W) // 2, (big.shape[0] - H) // 2
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    cv2.imwrite(a.out, big[y:y + H, x:x + W], [cv2.IMWRITE_WEBP_QUALITY, a.quality])
    print(f"scale {s:.4f}, {W}x{H}")


if __name__ == "__main__":
    main()
