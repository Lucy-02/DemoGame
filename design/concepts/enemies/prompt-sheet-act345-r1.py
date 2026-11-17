"""3·4·5막 적·보스 그림 r1: 1막과 같은 틀(방향 가 사나운 짐승) × 34종. (DemoGame 결정 0115·0116·0117 후보 시트)
  python3 tools/build_enemy_act345_r1.py  → experiments/enemy/enemy-act345-r1-20261118.json
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
 # ── 3막: 얼음 · 물 · 그림자 ──
 ("snowball", "눈덩이", Q, "snow creature, large round body of packed snow, twigs and pebbles stuck in the snow, two dark glaring eyes, jagged icicle teeth, rolling, snow spray, hand-drawn, smooth lineart", ", snowman, hat, scarf, carrot, 2::pixel art::, pixelated"),
 ("ice_rock", "얼음 바위", Q, "golem, ice monster, squat body made of jagged blue ice blocks, dark frozen rock core visible inside the ice, two glowing pale blue eyes, thick ice arms resting on the ground, frost mist, hand-drawn, smooth lineart", ", face, mouth, 2::pixel art::, pixelated"),
 ("droplet", "물방울", Q, "water creature, small teardrop-shaped body of clear blue water, ripples on the surface, two glowing white eyes, small splashing droplets around it, floating, no arms, no legs", ", face, mouth, slime girl"),
 ("rapids", "급류", L, "fish, large pike, body made of rushing white water, foaming river current forming the fins and tail, glowing pale eyes, open jaws, sharp teeth, water spray, leaping", ", scales, fishing"),
 ("shade", "그림자", L, "shadow creature, crouching black beast made of living shadow, ragged wispy edges, long thin claws, two glowing violet eyes, low stance, on all fours", ", fur detail, wolf"),
 ("dusk", "어스름", P, "shadow creature, floating wraith made of dark purple mist, tattered trailing lower body, hunched shoulders, thin long claws, two pale orange glowing eyes, no legs", ", face, mouth, hair, cloak, hood, girl"),
 ("hollow_armor", "빈 갑주", P, "living armor, empty suit of black plate armor, horned helmet, hollow visor with pale blue glow, frost on the plates, large curved blade fused to the right forearm, broad pauldrons, hunched, standing", ", face, skin, hair, knight girl, cape"),
 ("ice_warden", "빙벽지기", L, "bear, giant polar bear, white fur, thick plates of ice covering shoulders and back, ice spikes along spine, frosty breath, glaring pale blue eyes, bared teeth, standing on all fours", ""),
 ("tidal_serpent", "해일뱀", L, "sea serpent, giant snake, deep blue scales, tall fin crest along the back, body rising out of a breaking wave, open jaws, long fangs, water splashing, glowing yellow eyes", ", wings, legs, dragon girl"),
 ("twin_shade", "쌍둥이 그림자", L, "shadow creature, two-headed black beast made of living shadow, two heads side by side on one body, ragged wispy edges, long claws, four glowing violet eyes, on all fours", ", fur detail"),
 ("small_shade", "작은 그림자", Q, "shadow creature, small black imp-like beast made of living shadow, round body, ragged wispy edges, small claws, two glowing violet eyes, crouching", ", face, mouth, cute"),
 ("cold_snap", "한파", L, "mammoth, giant woolly mammoth, white frost-covered fur, huge curved tusks made of ice, icicles hanging from the belly, snow swirling around legs, glowing pale blue eyes, standing on all fours", ""),
 ("flood_tide", "밀물", L, "whale, giant whale, body made of deep blue seawater, white foam crest along the back, breaking waves around the body, barnacles, glowing white eyes, open mouth, swimming", ", ship, boat"),
 ("eclipse", "월식", L, "wolf, giant black wolf made of living shadow, wispy shadow fur, black disc with a thin glowing orange ring floating behind its head, glowing orange ring-shaped eyes, snarling, standing on all fours", ", moon face"),
 # ── 4막: 바람 · 빛 · 그림자 ──
 ("sand_gust", "모래바람", Q, "sand creature, swirling cloud of sand and dust shaped like a snarling beast head, hollow glowing yellow eyes, open maw, sand streaming behind it, floating, no legs", ", humanoid, girl"),
 ("pinwheel", "바람개비", Q, "creature shaped like a spinning pinwheel, four curved blade-like feathered wings arranged in a wheel around one central eye, pale green and white feathers, sharp wing edges, wind streaks, floating", ", toy, stick, paper, girl"),
 ("glass_mole", "유리 두더지", L, "mole, giant mole, translucent crystal glass body, prism reflections, faceted crystal claws, glowing white eyes, bared teeth, emerging from a mound of dirt", ""),
 ("halo", "빛무리", Q, "floating creature, ring of golden light, radiant halo body, one large eye in the center of the ring, small feathered wings of light, light rays, floating, no arms, no legs", ", angel, girl, face"),
 ("shade_claw", "그늘 발톱", L, "shadow creature, black panther made of living shadow, oversized long curved claws, ragged wispy edges, glowing teal eyes, crouching low, stalking, on all fours", ", fur detail"),
 ("gloam", "땅거미", L, "spider, giant spider, dark indigo body, dusk orange markings on abdomen, long thin legs, eight glowing orange eyes, fangs, hanging silk thread", ", spider girl, web background"),
 ("old_statue", "낡은 석상", Q, "living statue, guardian lion statue, weathered cracked grey stone, moss patches, chipped ear, hollow eyes with faint yellow glow, open stone jaws, sitting, hand-drawn, smooth lineart", ", fur, real lion, 2::pixel art::, pixelated"),
 ("storm_hawk", "폭풍 매", L, "bird, hawk, large hawk, grey and white feathers, dark storm clouds trailing from the wings, hooked beak, talons stretched forward, diving, wind streaks, two legs, glaring yellow eyes", ", phoenix, fire, griffin, four legs, quadruped"),
 ("mirror_knight", "거울 기사", P, "living armor, knight armor made of polished mirror plates, reflective silver surface, tall slim armor, hollow helmet with white glow inside the visor, large round mirror shield on the left arm, standing", ", face, skin, hair, knight girl, cape"),
 ("gloom_twin", "쌍둥이 그늘", L, "shadow creature, lean black jackal made of living shadow, glowing white crescent markings on the flank, long pointed ears, wispy tail, glowing white eyes, stalking, on all fours", ", fur detail"),
 ("typhoon", "태풍", L, "giant serpentine dragon made of storm wind and rain clouds, long body coiled into a spiral, hollow calm eye in the center of the spiral, pale teal and grey clouds, rain streaks, glowing white eyes, open jaws, flying", ", scales, wings, legs, dragon girl"),
 ("white_night", "백야", L, "reindeer, giant white reindeer, large antlers glowing pale gold, radiant antlers, white fur, soft aurora glow around the antlers, golden eyes, standing on all fours", ", fire, flames, sleigh"),
 ("dark_moon", "그믐", L, "bird, owl, giant black owl, feathers of living shadow, thin pale crescent moon mark on the chest, glowing pale yellow crescent-shaped eyes, wings spread wide, talons, two legs, flying", ", four legs, quadruped"),
 # ── 5막: 근원 ──
 ("ember_shard", "불 조각", P, "floating crystal creature, jagged red orange crystal shard, fire burning inside the crystal, glowing core, small crystal fragments orbiting, one glowing eye, floating, no arms, no legs", ", face, mouth, girl, gem on ring"),
 ("tide_shard", "물 조각", P, "floating crystal creature, jagged deep blue crystal shard, swirling water inside the crystal, glowing core, small water droplets orbiting, one glowing eye, floating, no arms, no legs", ", face, mouth, girl, gem on ring"),
 ("stone_shard", "땅 조각", P, "floating crystal creature, jagged shard of brown rock, glowing amber veins, glowing core, small pebbles orbiting, one glowing eye, floating, no arms, no legs", ", face, mouth, girl, gem on ring"),
 ("spark_shard", "전기 조각", P, "floating crystal creature, jagged yellow crystal shard, electricity crackling inside and around the crystal, glowing core, small sparks orbiting, one glowing eye, floating, no arms, no legs", ", face, mouth, girl, gem on ring"),
 ("gate_keeper", "문지기", P, "golem, colossal stone golem shaped like a gate, body is a massive ancient stone double door, carved spiral patterns on the door, two thick pillar arms, one glowing white eye above the door, short legs, standing, hand-drawn, smooth lineart", ", face, mouth, girl, 2::pixel art::, pixelated"),
 ("echo", "메아리", Q, "floating creature made of concentric pale rings, translucent rippling rings around a hollow dark center, two faint glowing eyes inside the hollow, pale grey and white, floating, no arms, no legs", ", face, mouth, girl, target"),
 ("origin", "근원", L, "primordial beast, large four-legged creature, smooth white body, antlers shaped like branching roots, nine glowing colored orbs embedded along its back and flanks, long tail, calm glowing white eyes, standing on all fours", ", fur detail, rainbow"),
]
SEEDS = {"ga": (8101, 8102, 8103)}
DIRS = {"ga": DIRS["ga"]}
cases = []
for eid, _name, (w, h), tags, negx in EN:
    for d, fn in DIRS.items():
        p, uc, scale, resc = fn(tags)
        for s in SEEDS[d]:
            cases.append({"case_id": f"{eid}-{d}-s{s}", "prompt": p, "uc": uc + negx, "seed": s, "scale": scale,
                          "cfg_rescale": resc, "skip_cfg_above_sigma": None, "width": w, "height": h})
exp = copy.deepcopy(base); exp["name"] = "enemy-act345-r1-20261118"; exp["cases"] = cases
exp["request"]["parameters"]["width"] = "${width}"; exp["request"]["parameters"]["height"] = "${height}"
json.dump(exp, open(ROOT / "experiments/enemy/enemy-act345-r1-20261118.json", "w"), indent=1, ensure_ascii=False)
print(len(cases)); print(cases[0]["prompt"]); print(cases[5]["prompt"][:300])
