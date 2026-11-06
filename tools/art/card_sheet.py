# 카드 일러스트 브리프(design/card/art/rounds/<r>/briefs.json)를 jjal nai-lab 시트(schema_version 2)로 바꿔요.
# 쓰는 법 (jjal 루트에서):
#   python3 -I <DemoGame>/tools/art/card_sheet.py <briefs.json> tools/style_presets.json \
#       --owner-style sal=<키> ibex=<키> star=<키> --alt-style '#15' \
#       > experiments/card-art/<name>.json
# 화풍 묶음(작가 prefix + 품질 suffix + negative + params)은 레지스트리 그대로 써요(spirit-art-rules §1, 임의 변경 금지).
# 무료 범위만: 1024×1024, 28스텝, n_samples 1, 베이스 이미지·레퍼런스 없음. 이 스크립트가 그 밖의 값을 넣지 않아요.
import argparse
import json
import re
import sys

FREE = {"width": 1024, "height": 1024, "steps": 28}


def load_presets(path):
    raw = json.load(open(path, encoding="utf-8"))
    items = raw if isinstance(raw, list) else raw.get("presets", raw)
    if isinstance(items, dict):
        items = [dict(v, key=k) if isinstance(v, dict) and "key" not in v else v for k, v in items.items()]
    return {p["key"]: p for p in items if isinstance(p, dict) and "key" in p}


# "clean" 모드에서 떼는 캐릭터용 태그 (R1 평가: 사물 카드에서 초상·피부 쪽으로 끌고, 작고 여백 있는 그림과 반대로 감)
CHAR_TAGS = {
    "shiny skin", "masterpiece portrait", "skindentation", "oiled skin", "mature female", "flat color",
    "simple illustration", "chibi", "loli, child, chibi", "beautiful gunbari", "hyper detail", "super detail",
    "intricate details", "detailed incredibly absurdres", "very detailed",
}
UC_DROP = {"negative space", "blank page"}


def strip_tags(text, drop):
    out = []
    for tok in text.split(","):
        lead = tok[: len(tok) - len(tok.lstrip(" {"))]
        trail = tok[len(tok.rstrip(" }")):]
        core = tok.strip(" {}")
        bare = core.split("::", 1)[1] if "::" in core and core.split("::", 1)[0].replace(".", "").lstrip("-").isdigit() else core
        bare = bare.rstrip(":").strip()
        if bare in drop:
            keep = lead.strip(" ") + trail.strip(" ")
            if keep:
                out.append(" " + keep)
            continue
        out.append(tok)
    res = ",".join(out)
    res = re.sub(r"(\{+)\s*,\s*", r"\1", res)
    return re.sub(r",\s*(\}+)", r"\1", res)


def join(*parts):
    return ", ".join(p.strip().strip(",") for p in parts if p and p.strip().strip(","))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("briefs")
    ap.add_argument("presets")
    ap.add_argument("--owner-style", nargs="+", required=True, help="owner=key ...")
    ap.add_argument("--alt-style", default="#15")
    ap.add_argument("--fallback-alt", default="b07_v2", help="owner 화풍이 alt와 같을 때 쓸 비교 화풍")
    ap.add_argument("--name")
    a = ap.parse_args()

    b = json.load(open(a.briefs, encoding="utf-8"))
    presets = load_presets(a.presets)
    owner_style = dict(s.split("=", 1) for s in a.owner_style)
    for k in list(owner_style.values()) + [a.alt_style, a.fallback_alt]:
        if k not in presets:
            sys.exit(f"레지스트리에 없는 화풍 키: {k} (있는 키: {', '.join(presets)})")

    c = b["common"]
    seen = set()
    cases = []
    if "variants" in b:
        for card in b["cards"]:
            own = owner_style[card["owner"]]
            p = presets[own]
            comp = c["composition_C"] if card["comp"] == "C" else c["composition"]
            uc_card = c["uc_C"] if card["comp"] == "C" else c["uc"]
            for v in card.get("variants", b["variants"]):
                prefix, suffix, neg = p.get("prefix", ""), p.get("suffix", ""), p.get("negative", "")
                params = dict(p.get("params", {}) or {})
                if v["mode"] == "clean":
                    prefix, suffix = strip_tags(prefix, CHAR_TAGS), strip_tags(suffix, CHAR_TAGS)
                    neg = strip_tags(neg, UC_DROP)
                    params["skip_cfg_above_sigma"] = None
                prompt = join(prefix, card["subject"], comp, b["tones"][card["owner"]], suffix, c["quality"])
                uc = join(uc_card, card.get("uc_extra", ""), neg)
                for seed in card.get("seeds", b["seeds"]):
                    cases.append({
                        "case_id": f"{card['id']}-{card['comp']}-{v['tag']}-s{seed}",
                        "prompt": prompt, "uc": uc, "seed": seed,
                        "scale": params.get("scale", 6), "cfg_rescale": params.get("cfg_rescale", 0.1),
                        "skip_cfg_above_sigma": params.get("skip_cfg_above_sigma"),
                    })
    for card in ([] if "variants" in b else b["cards"]):
        main_variant = card["id"] not in seen
        seen.add(card["id"])
        own = owner_style[card["owner"]]
        alt = a.alt_style if own != a.alt_style else a.fallback_alt
        styles = [("o", own), ("x", alt)] if main_variant and card["comp"] in ("B", "C") else [("o", own)]
        comp = c["composition_C"] if card["comp"] == "C" else c["composition"]
        uc_card = c["uc_A"] if card["comp"] == "A" else c["uc"]
        for tag, key in styles:
            p = presets[key]
            prompt = join(p.get("prefix", ""), card["subject"], comp, b["tones"][card["owner"]], p.get("suffix", ""), c["quality"])
            uc = join(uc_card, p.get("negative", ""))
            params = p.get("params", {}) or {}
            for seed in b["seeds"]:
                cases.append({
                    "case_id": f"{card['id']}-{card['comp']}-{tag}-s{seed}",
                    "prompt": prompt, "uc": uc, "seed": seed,
                    "scale": params.get("scale", 5),
                    "cfg_rescale": params.get("cfg_rescale", 0.1),
                    "skip_cfg_above_sigma": params.get("skip_cfg_above_sigma"),
                })

    sheet = {
        "schema_version": 2,
        "name": a.name or b["round"],
        "vars": {},
        "cases": cases,
        "matrix": [],
        "request": {
            "input": "${prompt}",
            "model": "nai-diffusion-4-5-full",
            "action": "generate",
            "parameters": {
                "params_version": 3, **FREE, "scale": "${scale}",
                "sampler": "k_euler_ancestral", "seed": "${seed}", "n_samples": 1,
                "negative_prompt": "${uc}", "uc": "${uc}", "ucPreset": 5,
                "qualityToggle": False, "sm": False, "sm_dyn": False, "autoSmea": False,
                "dynamic_thresholding": False, "cfg_rescale": "${cfg_rescale}", "noise_schedule": "karras",
                "legacy": False, "legacy_uc": False, "legacy_v3_extend": False,
                "deliberate_euler_ancestral_bug": False, "prefer_brownian": True,
                "skip_cfg_above_sigma": "${skip_cfg_above_sigma}", "use_coords": False, "characterPrompts": [], "uncond_scale": 1,
                "v4_prompt": {"caption": {"base_caption": "${prompt}", "char_captions": []}, "use_coords": False, "use_order": True},
                "v4_negative_prompt": {"caption": {"base_caption": "${uc}", "char_captions": []}, "legacy_uc": False},
            },
        },
    }
    json.dump(sheet, sys.stdout, ensure_ascii=False, indent=1)
    print(f"cases: {len(cases)}", file=sys.stderr)


if __name__ == "__main__":
    main()
