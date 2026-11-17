"""2막 적·보스 그림 r1: 1막과 같은 틀(방향 가 사나운 짐승) × 13종. (DemoGame 결정 0114 후보 시트)
  python3 tools/build_enemy_act2_r1.py  → experiments/enemy/enemy-act2-r1-20261118.json
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
EN = [  # id, 이름, 크기, 태그, 추가 네거티브
 ("rock_pile", "돌무더기", Q, "rock creature, living pile of boulders, body made of stacked round grey boulders, moss on the stones, two glowing amber eyes in a dark gap between rocks, short stubby stone legs, pebbles falling", ", face, mouth, humanoid, arms"),
 ("mole", "두더지", L, "mole, giant mole, dark brown fur, huge pale digging claws, pink snout, tiny eyes, bared teeth, emerging from a mound of dirt, clods of soil flying", ""),
 ("spark_bug", "찌릿벌레", L, "beetle, large beetle, glossy dark blue carapace, yellow zigzag markings on shell, electric sparks arcing between antennae, large mandibles, six legs, yellow glowing eyes", ", wings spread, flying"),
 ("lightning_rod", "피뢰침", P, "mechanical creature, tall thin iron spire body, pointed metal tip, copper coil wrapped around the body, three thin metal legs, single round glowing yellow eye, electric sparks arcing at the tip, standing", ", humanoid, arms, face, mouth, robot girl"),
 ("firefly_swarm", "반딧불 떼", Q, "fireflies, swarm of large fireflies, many insects flying close together in a ball, dark small bodies, bright yellow green glowing abdomens, light trails, floating", ", single insect, lantern, face"),
 ("mirror_shard", "거울 조각", Q, "floating creature made of broken mirror shards, sharp silver glass fragments arranged around a glowing white core, reflections on glass, one bright eye of light in the center, floating, no arms, no legs", ", face, mouth, humanoid, frame, crystal girl"),
 ("wandering_armor", "떠돌이 갑옷", P, "living armor, empty suit of plate armor, hollow helmet, dark empty visor with faint pale glow, dented rusty steel plates, torn cloth at the waist, heavy gauntlets, broad pauldrons, hunched, standing", ", face, skin, hair, knight girl, cape"),
 ("quake_turtle", "지진 거북", L, "tortoise, giant tortoise, shell made of cracked rock slabs, amber crystals growing on shell, thick pillar legs, beaked mouth, small glaring eyes, dust clouds at feet, standing on all fours", ", sea turtle, flippers"),
 ("thunder_bird", "번개 새", L, "bird, large eagle, dark indigo feathers, bright yellow jagged crest, yellow wing edges, electric sparks along wings, wings spread wide, hooked beak, talons, two legs, glowing yellow eyes, flying", ", phoenix, fire, griffin, four legs, quadruped"),
 ("lantern_keeper", "등불지기", P, "creature with an iron lantern for a head, warm yellow flame burning inside the lantern head, long thin body wrapped in tattered grey cloth, long arms, clawed hands, hunched, standing", ", face, hair, skin, girl, hat"),
 ("landslide", "산사태", L, "colossal four-legged beast made of boulders and packed earth, boar-like body, stone tusks, uprooted small trees and grass on its back, cracks along body, glowing amber eyes, falling pebbles, dust, standing on all fours", ", fur, humanoid"),
 ("thunderstorm", "뇌우", L, "serpent, giant serpentine dragon made of dark storm clouds, long body of swirling grey thunderclouds, lightning bolts crackling along body, glowing yellow eyes, open jaws, rain falling from body, flying", ", scales, wings, legs, eastern dragon girl"),
 ("high_noon", "한낮", L, "lion, large white lion, mane made of golden sun rays, blazing radiant golden mane, golden eyes, glowing sun disc behind head, heat shimmer, roaring, standing on all fours", ", fire, flames, wings"),
]
SEEDS = {"ga": (7201, 7202, 7203, 7204)}
DIRS = {"ga": DIRS["ga"]}
cases = []
for eid, _name, (w, h), tags, negx in EN:
    for d, fn in DIRS.items():
        p, uc, scale, resc = fn(tags)
        for s in SEEDS[d]:
            cases.append({"case_id": f"{eid}-{d}-s{s}", "prompt": p, "uc": uc + negx, "seed": s, "scale": scale,
                          "cfg_rescale": resc, "skip_cfg_above_sigma": None, "width": w, "height": h})
exp = copy.deepcopy(base); exp["name"] = "enemy-act2-r1-20261118"; exp["cases"] = cases
exp["request"]["parameters"]["width"] = "${width}"; exp["request"]["parameters"]["height"] = "${height}"
json.dump(exp, open(ROOT / "experiments/enemy/enemy-act2-r1-20261118.json", "w"), indent=1, ensure_ascii=False)
print(len(cases)); print(cases[0]["prompt"]); print(cases[5]["prompt"][:300])
