import json
import os

_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tnved_codes.json")
_codes_cache = None


def _load_codes() -> list[dict]:
    global _codes_cache
    if _codes_cache is None:
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            _codes_cache = json.load(f)["codes"]
    return _codes_cache


def resolve_tnved(material_type: str, product_type: str, gender: str, main_material: str) -> dict:
    """
    Определить код ТН ВЭД по 4 параметрам.
    material_type: трикотаж / текстиль
    product_type: платье, юбка, брюки...
    gender: male / female
    main_material: хлопок, полиэстер... (основной >50%)
    """
    codes = _load_codes()
    product_lower = product_type.lower().strip()
    material_lower = material_type.lower().strip()
    main_mat_lower = main_material.lower().strip()

    for entry in codes:
        # Match material type
        if entry["material_type"] != material_lower:
            continue

        # Match gender
        if entry["gender"] != "any" and entry["gender"] != gender:
            continue

        # Match product type
        if product_lower not in [p.lower() for p in entry["product_types"]]:
            continue

        # Found matching category — resolve by main material
        materials_map = entry["main_materials"]
        code = materials_map.get(main_mat_lower, materials_map.get("default", entry["code"]))

        return {
            "code": code,
            "description": entry["description"],
        }

    return {
        "code": "не определён",
        "description": f"Код не найден для: {material_type}, {product_type}, {gender}, {main_material}",
    }
