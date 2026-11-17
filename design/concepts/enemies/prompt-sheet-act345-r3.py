"""3·4·5막 적·보스 그림 r3(눈덩이·물방울·모래바람이 픽셀 그림으로 나와 다시, 본문에 -3::pixel art::): 1막과 같은 틀(방향 가 사나운 짐승) × 34종. (DemoGame 결정 0115·0116·0117 후보 시트)
  python3 tools/build_enemy_act345_r3.py  → experiments/enemy/enemy-act345-r3-20261118.json
방향: ga = 사나운 짐승(r5 A+D, 또렷 b07_v2) · na = ga + 어둡고 날카롭게(r5 B) · da = ga 묘사를 윤슬 ask_v2 그림체로
규칙(메모 enemy-unit-art-feedback): mascot·cute·simple 문구 없음, 특징은 해부학으로, 그림체 블록·꼬리 고정.
"""
import copy, json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
base = json.load(open(ROOT / "runs/enemy-concept-r1-20261112-20261111T205227Z/experiment.json"))
PRESET = {p["key"]: p for p in json.load(open(ROOT / "tools/style_presets.json"))}
B07, ASK = PRESET["b07_v2"], PRESET["ask_v2"]
VIEW = "grey background, simple background, wide shot, 2::full body::, -2::close-up, upper body, cowboy shot, portrait::, from side, facing left, looking to the side"
NEG_X = ("upskirt, panties, close-up, dark background, pixel art, 3d, from above, from below, cast shadow, drop shadow, sticker, white outline, "
         "human, 1girl, 1boy, humanization, chibi, ground, grass field, sword, weapon, holding")
GA = "monster, large powerful body, sharp eyes, glaring, imposing, aggressive stance"
NA = GA + ", dark fantasy, sharp silhouette, spikes, glowing eyes, ominous, dark color scheme, high contrast"
DIRS = {
 "ga": lambda t: (f"{B07['prefix']}, no humans, creature, {t}, {GA}, cel shading, 1.3::thick outline::, {VIEW}, {B07['suffix']}", B07["negative"] + ", " + NEG_X, 5, 0),
 "na": lambda t: (f"{B07['prefix']}, no humans, creature, {t}, {NA}, cel shading, 1.3::thick outline::, {VIEW}, {B07['suffix']}", B07["negative"] + ", " + NEG_X, 5, 0),
 "da": lambda t: (f"{ASK['prefix']}, no humans, creature, {t}, {GA}, {VIEW}, {ASK['suffix']}",
                  "nsfw, lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, multiple views, reference sheet, text, logo, watermark, signature, scenery, detailed background, cropped, out of frame, bad anatomy, realistic, blurry, " + NEG_X, 6, 0.1),
}
L, P, Q = (1216, 832), (832, 1216), (1024, 1024)
EN = [
 ("snowball", "눈덩이", Q, "snow monster, large round body of packed snow, rough lumpy surface, broken branches and pebbles stuck in the snow, two dark glaring eyes in deep sockets, wide mouth with jagged icicle teeth, snow spray, -3::pixel art, pixelated, dithering::, hand-drawn, smooth lineart, detailed shading", ", snowman, hat, scarf, carrot, 2::pixel art::, pixelated"),
 ("droplet", "물방울", Q, "water elemental creature, teardrop-shaped body of clear blue water, glossy highlights, ripples on the surface, two glowing white eyes, splashing droplets around it, floating, no arms, no legs, -3::pixel art, pixelated, dithering::, hand-drawn, smooth lineart, detailed shading", ", face, mouth, slime girl, 2::pixel art::, pixelated"),
 ("sand_gust", "모래바람", Q, "sand elemental beast, upper body of a snarling beast formed from swirling sand and dust, hollow glowing yellow eyes, open maw, lower body dissolving into a sandstorm swirl, sand streaming behind it, floating, -3::pixel art, pixelated, dithering::, hand-drawn, smooth lineart, detailed shading", ", humanoid, girl, 2::pixel art::, pixelated"),
]
SEEDS = {"ga": (8301, 8302, 8303, 8304)}
DIRS = {"ga": DIRS["ga"]}
cases = []
for eid, _name, (w, h), tags, negx in EN:
    for d, fn in DIRS.items():
        p, uc, scale, resc = fn(tags)
        for s in SEEDS[d]:
            cases.append({"case_id": f"{eid}-{d}-s{s}", "prompt": p, "uc": uc + negx, "seed": s, "scale": scale,
                          "cfg_rescale": resc, "skip_cfg_above_sigma": None, "width": w, "height": h})
exp = copy.deepcopy(base); exp["name"] = "enemy-act345-r3-20261118"; exp["cases"] = cases
exp["request"]["parameters"]["width"] = "${width}"; exp["request"]["parameters"]["height"] = "${height}"
json.dump(exp, open(ROOT / "experiments/enemy/enemy-act345-r3-20261118.json", "w"), indent=1, ensure_ascii=False)
print(len(cases)); print(cases[0]["prompt"])
