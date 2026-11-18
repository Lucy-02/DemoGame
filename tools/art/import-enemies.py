# 적 그림(임시 선택, 0100 · 0114 ~ 0117)을 게임용 파일로 옮겨요.
# 쓰는 법: python -I tools/art/import-enemies.py <jjal 전달 폴더 (tools/enemy_deliver.py 결과)> <저장소 루트>
# 만드는 것: public/assets/enemies/<적 id>.webp (알파로 잘린 누끼, 긴 변 LONG)
#          design/concepts/enemies/picks.json (어느 후보를 연결했는지)
#          assets/provenance.jsonl에 파일마다 한 줄 (같은 경로의 옛 줄은 바꿔요)
# 크기와 발 위치는 src/presentation/battle/enemyFit.json에 사람이 맞춰요. 다시 돌려도 지워지지 않아요.
# 필요: Pillow
import hashlib, json, sys
from pathlib import Path
from PIL import Image

LONG = 768
# 누끼 공정 (전달 폴더 meta.json의 matte). 정식 = 정령과 같은 공정 (jjal 정본 8절 2 · 3단계, luddal-win)
PICK = "Claude가 후보 시트에서 임시로 고름 (Lucy 선택 전). "
TAIL = ", 알파 기준으로 자르고 긴 변 768로 줄임, webp 변환"
WORK = {
    "rembg": PICK + "배경 제거(rembg isnet-anime) 뒤 갇힌 배경색 덩어리 비우기 · 경계 1px 정리 · 배경색 빼기" + TAIL,
    "final": PICK + "배경 제거(ToonOut · BiRefNet · ISNet 하이브리드 + ViTMatte) · 경계 1px 정리, 2배 업스케일(RealESRGAN anime_6B, RGB · 알파 따로)" + TAIL,
    "rembg+up": PICK + "배경 제거(rembg isnet-anime, 색 차이로 따기: 정식 공정이 점 무리 바깥을 버려서 유지) · 경계 1px 정리, 2배 업스케일(RealESRGAN anime_6B, RGB · 알파 따로)" + TAIL,
}
MODELS = {"nai-diffusion-4-5-full": "NovelAI Diffusion V4.5 Full"}
src, root = Path(sys.argv[1]), Path(sys.argv[2])
meta = json.load(open(src / "meta.json"))
out = root / "public/assets/enemies"
out.mkdir(parents=True, exist_ok=True)
prov = root / "assets/provenance.jsonl"
lines = [l for l in prov.read_text().split("\n") if l.strip()]
pick_file = root / "design/concepts/enemies/picks.json"
# 앞서 들여온 막의 칸은 남기고 이번 것만 바꿔요
picks = json.load(open(pick_file)) if pick_file.exists() else {}
for eid, m in sorted(meta.items()):
    im = Image.open(src / f"{eid}.rgba.png").convert("RGBA")
    im.thumbnail((LONG, LONG), Image.LANCZOS)
    name = f"{eid.replace('_', '-')}.webp"
    im.save(out / name, "WEBP", quality=90, method=6)
    path = f"assets/enemies/{name}"
    row = {
        "path": path, "sha256": hashlib.sha256((out / name).read_bytes()).hexdigest(), "status": "placeholder",
        "model": MODELS.get(m["model"], m["model"]), "prompt_sheet": f"jjal {m['run_id']} {m['case_id']}",
        "prompt": m["prompt"], "negative": m["negative"], "seed": m["seed"], "settings": m["settings"], "references": None,
        "source_png": f"jjal runs/{m['run_id']} {m['request_id']} (sha256 {m['source_sha256']})",
        "human_work": WORK[m.get("matte", "rembg")],
        "note": "임시 선택 (0100 · 0114). Lucy가 후보 시트에서 고르면 바꿔요",
    }
    lines = [l for l in lines if json.loads(l).get("path") != path]
    lines.append(json.dumps(row, ensure_ascii=False))
    picks[eid] = {"case_id": m["case_id"], "run_id": m["run_id"], "seed": m["seed"], "size": list(im.size)}
prov.write_text("\n".join(lines) + "\n")
(root / "design/concepts/enemies").mkdir(parents=True, exist_ok=True)
json.dump(picks, open(pick_file, "w"), ensure_ascii=False, indent=1)
print(len(meta), "장")
