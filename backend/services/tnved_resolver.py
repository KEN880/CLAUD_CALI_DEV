import json
import os

_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tnved_codes.json")
_cache = None


def _load() -> dict:
    global _cache
    if _cache is None:
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            _cache = json.load(f)
    return _cache


def determine_layer(product_type: str) -> int:
    """Автоопределение слоя одежды по типу изделия (ТР ТС 017/2011)."""
    data = _load()
    pt = product_type.lower().strip()
    for layer_str, items in data["layer_rules"].items():
        if pt in [i.lower() for i in items]:
            return int(layer_str)
    return 2  # по умолчанию 2 слой


def resolve_tnved(weaving_type: str, product_type: str, gender: str, main_material: str) -> dict:
    """
    Определить 10-значный код ТН ВЭД по параметрам.
    weaving_type: трикотаж / швейка
    product_type: платье, юбка, брюки...
    gender: male / female
    main_material: хлопок, полиэстер... (основной >50%)
    """
    data = _load()
    codes = data["codes"]
    pt = product_type.lower().strip()
    wt = weaving_type.lower().strip()
    mm = main_material.lower().strip()

    for entry in codes:
        if entry["weaving_type"] != wt:
            continue
        if entry["gender"] != "any" and entry["gender"] != gender:
            continue
        if pt not in [p.lower() for p in entry["product_types"]]:
            continue

        materials_map = entry["main_materials"]
        code = materials_map.get(mm, materials_map.get("default", entry["code_group"] + " 00 000 0"))

        return {
            "code": code,
            "description": entry["description"],
        }

    # Fallback — generic code
    group = "61" if wt == "трикотаж" else "62"
    return {
        "code": f"{group}14 90 000 0" if wt == "трикотаж" else f"{group}11 49 000 0",
        "description": f"Код определён приблизительно для: {weaving_type}, {product_type}, {gender}",
    }
