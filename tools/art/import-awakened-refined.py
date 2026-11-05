# 전체 재묘사한 각성체 일러스트를 게임 webp로 옮겨요. 퍼핏과 같은 그림을 쓰게 해요(0002).
# 쓰는 법: python -I tools/art/import-awakened-refined.py <jjal exports/final-20261102/refined 폴더> <저장소 루트>
# 만드는 것: public/assets/spirits/<정령>/awakened.webp (알파로 자르고 긴 변 1536, import-spirits.py와 같은 규격)
#          assets/provenance.jsonl에서 그 파일 줄의 sha256·작업 기록을 고쳐요. 프롬프트·시드는 그대로 둬요
# 구도(spiritFrames.json)는 다시 만들지 않아요. 재묘사는 포즈와 알파를 유지해서 얼굴 자리가 그대로예요.
# 필요: Pillow, numpy
import hashlib, importlib.util, json, sys
from pathlib import Path
from PIL import Image


def main(refined: Path, repo: Path):
    spec = importlib.util.spec_from_file_location("import_spirits", repo / "tools/art/import-spirits.py")
    base = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(base)
    prov = repo / "assets/provenance.jsonl"
    lines = prov.read_text(encoding="utf-8").splitlines()
    done = {}
    for src in sorted(refined.glob("*__awakened.rgba.png")):
        sid = src.name.split("__")[0]
        im = Image.open(src).convert("RGBA")
        body = base.defringe(im.crop(im.getbbox()))
        body.thumbnail((base.LONG, base.LONG), Image.LANCZOS)
        out = repo / "public/assets/spirits" / sid / "awakened.webp"
        body.save(out, "WEBP", quality=86, method=6)
        done[f"assets/spirits/{sid}/awakened.webp"] = hashlib.sha256(out.read_bytes()).hexdigest()
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        row = json.loads(line)
        if row.get("path") in done:
            row["sha256"] = done[row["path"]]
            note = " Claude가 Anima Base + Tile & Repair LLLite로 전체 재묘사, Lucy 선별."
            if note not in row.get("human_work", ""):  # 같은 정령을 다시 반입해도 기록이 겹치지 않게 해요
                row["human_work"] = row.get("human_work", "") + note
            row["note"] = "전체 재묘사본(2026-11-05). 출시 판정 전"
            lines[i] = json.dumps(row, ensure_ascii=False)
    prov.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(done)} files")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
