import pandas as pd
from io import BytesIO


def parse_products_file(file_bytes: bytes, filename: str) -> list[dict]:
    """
    Парсинг CSV или Excel файла с продукцией.
    Ожидаемые колонки:
    - артикул / article
    - наименование / name
    - тип_изделия / product_type
    - тип_материала / weaving_type (трикотаж/текстиль)
    - группа / target_group (adult_male, adult_female, child)
    - возраст / age_group (до 3 лет, 3+, или пусто)
    - слой / layer (1, 2, 3)
    - состав / compositions (формат: "хлопок 80%, полиэстер 20%")
    """
    if filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(file_bytes), encoding="utf-8")
    else:
        df = pd.read_excel(BytesIO(file_bytes))

    # Normalize column names
    col_map = {
        "артикул": "article",
        "наименование": "name",
        "тип_изделия": "product_type",
        "тип изделия": "product_type",
        "тип_материала": "weaving_type",
        "тип материала": "weaving_type",
        "группа": "target_group",
        "возраст": "age_group",
        "слой": "layer",
        "состав": "compositions_raw",
    }
    df.columns = [col_map.get(c.strip().lower(), c.strip().lower()) for c in df.columns]

    products = []
    for _, row in df.iterrows():
        compositions = []
        raw = str(row.get("compositions_raw", ""))
        if raw and raw != "nan":
            for part in raw.split(","):
                part = part.strip()
                # Parse "хлопок 80%" or "80% хлопок"
                tokens = part.replace("%", "").split()
                if len(tokens) >= 2:
                    try:
                        pct = float(tokens[-1])
                        name = " ".join(tokens[:-1])
                    except ValueError:
                        try:
                            pct = float(tokens[0])
                            name = " ".join(tokens[1:])
                        except ValueError:
                            continue
                    compositions.append({"material_name": name, "percentage": pct})

        age = row.get("age_group")
        if pd.isna(age):
            age = None
        else:
            age = str(age).strip()

        products.append({
            "article": str(row.get("article", "")).strip(),
            "name": str(row.get("name", "")).strip(),
            "product_type": str(row.get("product_type", "")).strip(),
            "weaving_type": str(row.get("weaving_type", "")).strip(),
            "target_group": str(row.get("target_group", "")).strip(),
            "age_group": age,
            "layer": int(row.get("layer", 1)),
            "compositions": compositions,
        })

    return products
