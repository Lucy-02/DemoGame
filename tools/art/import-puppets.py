# 정령 퍼핏(각성체 idle)을 게임 파일로 옮겨요. 리그를 만드는 빌더는 jjal 저장소 tools/motion에 있어요(0002).
# 쓰는 법: python -I tools/art/import-puppets.py <jjal exports/motion 폴더> <저장소 루트> [<jjal 2× 원본 폴더, 기본 ../final-20261102/up2x>]
# 읽는 것: <jjal>/<정령>-awakened/rig/atlas/{rig.json, atlas@2.bc7.ktx, atlas@2.png}  (build_atlas.py 결과)
# 만드는 것: public/assets/puppets/<정령>/{rig.json, atlas@2.bc7.ktx, atlas@2.png}, public/assets/puppets/index.json
#          assets/provenance.jsonl에 파일마다 한 줄 (원본 각성체 일러스트 기록을 이어받아요)
# 필요: Pillow, numpy
# rig.json은 런타임(src/presentation/puppet)이 읽는 필드만 남기고 소수를 줄여요. 해상도 티어는 @2만 넣어요(Lucy 2026-11-03).
# art.bbox: 리그 캔버스에서 원본 일러스트의 알파 경계 상자. 정령 일러스트 webp(import-spirits.py)가 같은 상자로 잘려 있어서,
#           화면이 일러스트 자리(placeArt)에 퍼핏을 같은 크기로 올릴 때 써요.
import hashlib, json, shutil, sys
import numpy as np
from PIL import Image
from pathlib import Path

FORMAT = 1
TIER = "2"
# 레이어에서 런타임이 쓰는 채널과 소수 자리
LAYER_KEYS = {"name": None, "texture": None, "tris": None, "verts": 2, "uvs": 2, "head": 4, "bx": 3, "by": 3, "sway": 4,
              "earL": 4, "earR": 4, "spring": 4, "hb": None, "hw": 4, "hpx": 4, "hpy": 4, "hp": 4, "hn": 3,
              "seg": None, "t": 4, "tc": None, "rot": None, "rw": 4, "hem": 4, "hx": 3}


def rounded(v, nd):
    return v if nd is None else [round(x, nd) for x in v]


def slim(rig: dict, bbox: list[int]) -> dict:
    p = rig["points"]
    out = {
        "format": FORMAT,
        "canvas": rig["canvas"],
        "points": {k: p[k] for k in ("head_pivot", "hair_root", "pelvis", "ears") if k in p},
        "bundles": rig.get("bundles", {}),
        "chains": [{**c, "pts": [[round(x, 2), round(y, 2)] for x, y in c["pts"]]} for c in rig.get("chains", [])],
        "motion": rig.get("motion", {}),
        "art": {"bbox": bbox},
        "layers": [{k: rounded(l[k], nd) for k, nd in LAYER_KEYS.items() if k in l} for l in rig["layers"]],
    }
    if not out["chains"] and rig.get("tail_chain"):
        out["chains"] = [{"pts": rig["tail_chain"], "profile": "tail"}]
    a = rig["atlas"]
    out["atlas"] = {"size": a["size"], "tiers": {TIER: a["tiers"][TIER]}, "png_tiers": {TIER: a["png_tiers"][TIER]}}
    return out


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    src, root = Path(sys.argv[1]), Path(sys.argv[2])
    up2x = Path(sys.argv[3]) if len(sys.argv) > 3 else src.parent / "final-20261102/up2x"
    dst = root / "public/assets/puppets"
    prov_p = root / "assets/provenance.jsonl"
    raw = [l for l in prov_p.read_text().splitlines() if l.strip()]
    prov = [json.loads(l) for l in raw]
    by_path = {e["path"]: e for e in prov}
    changed = set()
    ids = []
    for d in sorted(src.glob("*-awakened")):
        atlas = d / "rig/atlas"
        if not (atlas / "rig.json").exists():
            continue
        sid = d.name.removesuffix("-awakened")
        rig = json.loads((atlas / "rig.json").read_text())
        files = [rig["atlas"]["tiers"][TIER]["file"], rig["atlas"]["png_tiers"][TIER]]
        out = dst / sid
        out.mkdir(parents=True, exist_ok=True)
        for f in files:
            shutil.copyfile(atlas / f, out / f)
        a = np.asarray(Image.open(up2x / f"{sid}__awakened.rgba.png").getchannel("A")) > 0
        ys, xs = np.nonzero(a)
        bbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        (out / "rig.json").write_text(json.dumps(slim(rig, bbox), separators=(",", ":")))
        ids.append(sid)
        source = by_path.get(f"assets/spirits/{sid}/awakened.webp", {})
        for f in files + ["rig.json"]:
            if f == "rig.json":
                continue  # 이미지가 아닌 리그 데이터는 출처 검사 대상이 아니에요
            key = f"assets/puppets/{sid}/{f}"
            changed.add(key)
            by_path[key] = {
                "path": key, "sha256": sha(out / f), "status": source.get("status", "placeholder"),
                "model": source.get("model", "NovelAI Diffusion (원본 기록 확인 필요)"),
                "source_png": f"assets/spirits/{sid}/awakened.webp 와 같은 원본 (그 줄의 prompt·seed 참고)",
                "human_work": "Claude가 레이어 분해(See-through·SAM), 가려진 면 채움, 절차적 idle 리깅, 아틀라스·BC7 변환 (jjal tools/motion)",
                "note": "퍼핏 아틀라스 @2. 원본 각성체 일러스트의 파생물",
            }
        print(f"{sid}: {', '.join(files)} + rig.json ({(out / 'rig.json').stat().st_size // 1024} KB)")
    (dst / "index.json").write_text(json.dumps({"format": FORMAT, "spirits": ids}, ensure_ascii=False, indent=1) + "\n")
    # 손대지 않은 줄은 글자 그대로, 바뀐 줄은 제자리에서 바꾸고, 새 줄은 뒤에
    dump = lambda e: json.dumps(e, ensure_ascii=False, separators=(",", ":"))
    lines = [dump(by_path[e["path"]]) if e["path"] in changed else r for r, e in zip(raw, prov)]
    have = {e["path"] for e in prov}
    lines += [dump(by_path[k]) for k in sorted(changed - have)]
    prov_p.write_text("".join(l + "\n" for l in lines))
    print(f"puppets {len(ids)}, provenance {len(lines)} lines")


if __name__ == "__main__":
    main()
