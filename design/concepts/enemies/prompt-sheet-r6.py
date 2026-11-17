"""1막 적·보스 그림 r6: 방향 셋 × 14종. (DemoGame 결정 0100 후보 시트)
  python3 tools/build_enemy_r6.py  → experiments/enemy/enemy-r6-20261118.json
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
 ("moss_slime", "이끼 슬라임", Q, "slime (creature), large dome-shaped slime, translucent dark green body, thick wet moss covering the top, small brown mushrooms growing on back, wide open mouth, jagged teeth, narrow yellow eyes, dripping slime", ""),
 ("bramble_rat", "가시쥐", L, "rat, giant rat, dark brown fur, thorny bramble vines growing along spine, long sharp thorns on back, red eyes, bared incisors, long bare tail, on all fours, hunched back", ""),
 ("wisp", "깜부기", Q, "ember creature, floating, small round body of charred black coal, cracked surface glowing orange from inside, flame burning on top of body, two glowing yellow eyes, trailing sparks, smoke, no arms, no legs", ", face, mouth, ghost"),
 ("rubble_shell", "돌집게", L, "hermit crab, giant hermit crab, shell made of stacked grey rubble stones, large pincers covered in stone, grey carapace, stalk eyes, six legs", ", red, orange"),
 ("tempest_crow", "바람새", L, "bird, crow, large crow, dark slate blue feathers, pale teal wind swirls trailing from wing tips, spread wings, hooked beak, open beak, talons, pale glowing eyes, flying", ""),
 ("whirl", "돌개바람", P, "tornado creature, living whirlwind, funnel-shaped body of spinning pale teal wind, dry grass and leaves caught in the spin, two glowing white eyes inside the funnel, no arms, no legs, floating", ", face, mouth, cloud"),
 ("rust_golem", "녹슨 골렘", P, "golem, squat heavy body, riveted iron plates, reddish brown rust, corroded metal, oversized right fist, glowing orange cracks, embers, no mouth, two glowing orange eyes, hunched, standing", ", humanoid face, mouth, rock, stone"),
 ("bog_witch", "늪 두꺼비", Q, "toad, giant toad, warty murky green skin, moss and reeds growing on back, inflated throat sac, wide mouth, yellow eyes, horizontal pupils, squatting, mud dripping", ", hat, staff, clothes"),
 ("frostfang", "칼바람 늑대", L, "wolf, lean white wolf, saber-toothed, long fangs growing from upper jaw, open mouth, snarling, pale teal wind streaks along mane and tail, standing on all fours", ", blade, floating object"),
 ("frost_pup", "칼바람 늑대 새끼", L, "wolf, young wolf, small white wolf, short fangs, growling, bared teeth, pale teal wind streaks on tail, standing on all fours, raised hackles", ", blade, floating object, puppy, cute"),
 ("cinder_imp", "그을음 도깨비", P, "imp, goblin, short stocky body, soot black skin, single curved horn on forehead, horn tip glowing ember orange, glowing orange eyes, wide grin, sharp teeth, clawed hands, crouching, smoke rising from shoulders", ", wings, tail, clothes"),
 ("grimbark", "시듦", P, "treant, ancient withered tree monster, gnarled grey brown bark body, hollow eyes glowing pale green, bare branches growing from head like antlers, dead leaves, long branch arms, root legs, cracked bark", ", green leaves, flowers"),
 ("wildfire", "들불", L, "deer, stag, large stag, dark charcoal fur, glowing ember cracks along body, antlers made of fire, mane of flames, glowing orange eyes, burning dry grass at hooves, smoke, standing on all fours", ""),
 ("gale", "높새", L, "bird, giant bird, long ribbon-like tail feathers, white and sky teal feathers, wings spread wide, streams of wind trailing from wings, sharp eyes, hooked beak, flying", ", phoenix, fire"),
]
SEEDS = {"ga": (6201, 6202, 6203), "na": (6201, 6202), "da": (6201, 6202)}
cases = []
for eid, _name, (w, h), tags, negx in EN:
    for d, fn in DIRS.items():
        p, uc, scale, resc = fn(tags)
        for s in SEEDS[d]:
            cases.append({"case_id": f"{eid}-{d}-s{s}", "prompt": p, "uc": uc + negx, "seed": s, "scale": scale,
                          "cfg_rescale": resc, "skip_cfg_above_sigma": None, "width": w, "height": h})
exp = copy.deepcopy(base); exp["name"] = "enemy-r6-20261118"; exp["cases"] = cases
exp["request"]["parameters"]["width"] = "${width}"; exp["request"]["parameters"]["height"] = "${height}"
json.dump(exp, open(ROOT / "experiments/enemy/enemy-r6-20261118.json", "w"), indent=1, ensure_ascii=False)
print(len(cases)); print(cases[0]["prompt"]); print(cases[5]["prompt"][:300])
