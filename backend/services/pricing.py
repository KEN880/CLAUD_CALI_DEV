PRICES = {
    "KR": {"CC": 30000, "DC": 25000},
    "RF": {"CC": 35000, "DC": None},
}

EXTRA_PROTOCOL_PRICE = 7000  # сом за доп. ПИ


def calculate_price(country_type: str, doc_type: str, protocol_count: int, duration_years: int) -> dict:
    base = PRICES.get(country_type, {}).get(doc_type)

    if base is None:
        return {
            "base_price": 0,
            "extra_protocols_price": 0,
            "total_price": 0,
            "doc_type": doc_type,
            "duration_years": duration_years,
            "available": False,
            "message": "Декларация о соответствии недоступна для заявителей из РФ",
        }

    if doc_type == "CC":
        duration_years = 1
    if doc_type == "DC" and duration_years not in (1, 3):
        duration_years = 1

    extra = max(0, protocol_count - 1) * EXTRA_PROTOCOL_PRICE
    total = base + extra

    return {
        "base_price": base,
        "extra_protocols_price": extra,
        "total_price": total,
        "doc_type": doc_type,
        "duration_years": duration_years,
        "available": True,
        "message": None,
    }


def determine_doc_type(target_group: str, layer: int, age_group: str | None) -> dict:
    is_child = target_group == "child"
    requires_sgr = is_child and age_group == "до 3 лет"

    if is_child:
        tr_ts = "007/2011"
        doc_type = "CC" if layer in (1, 2) else "DC"
    else:
        tr_ts = "017/2011"
        doc_type = "CC" if layer == 1 else "DC"

    return {"doc_type": doc_type, "tr_ts": tr_ts, "requires_sgr": requires_sgr}
