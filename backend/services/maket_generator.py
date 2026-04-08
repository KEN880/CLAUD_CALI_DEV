"""
Generate a Макет ДС (Declaration of Conformity layout) as a .docx file.
Uses python-docx to produce a two-page document:
  Page 1 — Declaration body
  Page 2 — Appendix with product/TNVED table
"""

from io import BytesIO
from docx import Document
from docx.shared import Pt, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn


def _set_cell_border(cell, **kwargs):
    """Set cell border. Usage: _set_cell_border(cell, top={"sz": 6, "val": "single"})"""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.find(qn("w:tcBorders"))
    if tcBorders is None:
        tcBorders = tc.makeelement(qn("w:tcBorders"), {})
        tcPr.append(tcBorders)
    for edge, attrs in kwargs.items():
        element = tcBorders.find(qn(f"w:{edge}"))
        if element is None:
            element = tc.makeelement(qn(f"w:{edge}"), {})
            tcBorders.append(element)
        for attr_name, attr_val in attrs.items():
            element.set(qn(f"w:{attr_name}"), str(attr_val))


def _add_paragraph(doc, text, font_size=12, bold=False, alignment=None, space_after=None, space_before=None):
    """Helper to add a formatted paragraph."""
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(font_size)
    run.bold = bold
    # Force Times New Roman for Cyrillic
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = run._element.makeelement(qn("w:rFonts"), {})
        rPr.append(rFonts)
    rFonts.set(qn("w:eastAsia"), "Times New Roman")

    if alignment is not None:
        p.alignment = alignment
    if space_after is not None:
        p.paragraph_format.space_after = Pt(space_after)
    if space_before is not None:
        p.paragraph_format.space_before = Pt(space_before)
    return p


def _weaving_adj(weaving: str) -> str:
    """Convert weaving type to adjective form."""
    if weaving.lower() in ("трикотаж", "трикотажные"):
        return "трикотажные"
    return "швейные"


def _gender_adj(gender: str) -> str:
    """Convert gender to adjective form."""
    mapping = {
        "Мужской": "мужские",
        "Женский": "женские",
        "Детский": "детские",
    }
    return mapping.get(gender, "женские")


def _company_prefix(company_type: str) -> str:
    """Return full company type prefix."""
    if company_type == "ИП":
        return "Индивидуальный предприниматель"
    return "Общество с ограниченной ответственностью"


def _format_trademarks(trademarks: str) -> str:
    """Format comma-separated trademarks with quotes."""
    parts = [t.strip() for t in trademarks.split(",") if t.strip()]
    return ", ".join(f"\u00ab{t}\u00bb" for t in parts)


def generate_maket_cc(data: dict) -> bytes:
    """
    Generate a Макет СС (Certificate of Conformity layout) document.
    Follows the real CC template structure — different from DS.
    You only fill in: product description + TNVED table in appendix.
    The rest (expert fields) are left as placeholders.
    No OKPO in CC (unlike DS).
    """
    doc = Document()

    style = doc.styles["Normal"]
    font = style.font
    font.name = "Times New Roman"
    font.size = Pt(12)

    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(1.5)

    # ===== PAGE 1: CERTIFICATE BODY =====

    _add_paragraph(doc, "№ ЕАЭС KG …..", font_size=11,
                   alignment=WD_ALIGN_PARAGRAPH.RIGHT, space_after=6)

    _add_paragraph(doc, "ОРГАН ПО СЕРТИФИКАЦИИ …..",
                   font_size=11, bold=True, space_after=8)

    # Applicant — no OKPO in CC
    applicant_type = data.get("applicantType", "ИП")
    applicant_name = data.get("applicantName", "")
    applicant_inn = data.get("applicantInn", "")
    applicant_address = data.get("applicantAddress", "")
    applicant_phone = data.get("applicantPhone", "")
    applicant_email = data.get("applicantEmail", "")
    applicant_full = f"{_company_prefix(applicant_type)} {applicant_name}"

    _add_paragraph(doc,
        f"ЗАЯВИТЕЛЬ  {applicant_full}, ИНН {applicant_inn}; "
        f"Место нахождения: Кыргызская Республика, {applicant_address} "
        f"Место осуществления деятельности: "
        f"телефон: {applicant_phone} электронная почта: {applicant_email}",
        font_size=11, space_after=6)

    # Manufacturer
    same = data.get("sameAsApplicant", False)
    if same:
        mfr_name = applicant_name
        mfr_address = applicant_address
    else:
        mfr_type = data.get("manufacturerType", "ИП")
        mfr_name = data.get("manufacturerName", "")
        mfr_address = data.get("manufacturerProductionAddress", "") or data.get("manufacturerAddress", "")

    _add_paragraph(doc,
        f"ИЗГОТОВИТЕЛЬ  {mfr_name} Место осуществления деятельности: {mfr_address}",
        font_size=11, space_after=6)

    # Product description — THIS IS WHAT YOU FILL
    weaving = data.get("productWeaving", "Трикотаж")
    layer = data.get("productLayer", "2")
    gender = data.get("productGender", "Женский")
    trademarks = data.get("productTrademarks", "")
    gender_adj = _gender_adj(gender)
    weaving_adj = _weaving_adj(weaving)
    tm_formatted = _format_trademarks(trademarks) if trademarks else '«»'

    _add_paragraph(doc,
        f"ПРОДУКЦИЯ    Изделия {weaving_adj} {layer} слоя {gender_adj}, "
        f"торговой марки {tm_formatted}, "
        f"согласно приложению, на 2 листе(ах), серийный выпуск;",
        font_size=11, space_after=6)

    # TNVED
    _add_paragraph(doc,
        "КОД ТН ВЭД ЕАЭС  согласно приложению на 2 листе(ах)",
        font_size=11, space_after=6)

    # Conformity
    tr_ts = data.get("trTs", "017/2011")
    _add_paragraph(doc,
        f"СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ  ТР ТС {tr_ts} "
        f"\u00abО безопасности продукции легкой промышленности\u00bb.",
        font_size=11, space_after=6)

    # Expert fills these
    _add_paragraph(doc, "СЕРТИФИКАТ ВЫДАН НА ОСНОВАНИИ   ……..",
                   font_size=11, space_after=6)
    _add_paragraph(doc, "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ  …………",
                   font_size=11, space_after=6)
    _add_paragraph(doc, "СРОК ДЕЙСТВИЯ C …… ПО …….",
                   font_size=11, space_after=12)

    # Signature blocks — expert fills
    _add_paragraph(doc,
        "Руководитель (уполномоченное лицо) органа по сертификации"
        "    _____________     М.П.  __________________",
        font_size=10, space_after=2)
    _add_paragraph(doc, "                                  (подпись)          (Ф.И.О.)",
                   font_size=9, space_after=8)
    _add_paragraph(doc,
        "Эксперт (эксперт-аудитор)"
        " (эксперты (эксперты-аудиторы)) _____________     М.П.     _________________",
        font_size=10, space_after=2)
    _add_paragraph(doc, "                                  (подпись)             (Ф.И.О.)",
                   font_size=9, space_after=4)

    # ===== PAGE 2: APPENDIX =====
    doc.add_page_break()

    _add_paragraph(doc, "к сертификату соответствия № ЕАЭС KG ….",
                   font_size=11, bold=True, alignment=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    _add_paragraph(doc, "Перечень конкретной продукции,",
                   font_size=11, bold=True, alignment=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
    _add_paragraph(doc, "на которую распространяется действие сертификата соответствия",
                   font_size=11, bold=True, alignment=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)

    # Product description line above table
    _add_paragraph(doc,
        f"Изделия {weaving_adj} {layer} слоя, торговой марки {tm_formatted}",
        font_size=11, space_after=6)

    # Table: №, Код ТН ВЭД ЕАЭС, Наименование и обозначение продукции + изготовитель
    tnved_lines = [l.strip() for l in data.get("tnvedCodes", "").strip().split("\n") if l.strip()]
    product_lines = [l.strip() for l in data.get("productList", "").strip().split("\n") if l.strip()]
    row_count = max(len(tnved_lines), len(product_lines), 5)  # at least 5 rows like template

    table = doc.add_table(rows=row_count + 1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["№", "Код ТН ВЭД\nЕАЭС", "Наименование и обозначение продукции, ее изготовитель"]
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _set_cell_border(cell, top={"sz": "6", "val": "single", "color": "000000"},
                         bottom={"sz": "6", "val": "single", "color": "000000"},
                         start={"sz": "6", "val": "single", "color": "000000"},
                         end={"sz": "6", "val": "single", "color": "000000"})

    for row_idx in range(row_count):
        row = table.rows[row_idx + 1]
        code = tnved_lines[row_idx] if row_idx < len(tnved_lines) else ""
        product = product_lines[row_idx] if row_idx < len(product_lines) else ""
        for col_idx, val in enumerate([str(row_idx + 1), code, product]):
            cell = row.cells[col_idx]
            cell.text = ""
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.name = "Times New Roman"
            run.font.size = Pt(10)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            _set_cell_border(cell, top={"sz": "4", "val": "single", "color": "000000"},
                             bottom={"sz": "4", "val": "single", "color": "000000"},
                             start={"sz": "4", "val": "single", "color": "000000"},
                             end={"sz": "4", "val": "single", "color": "000000"})

    for row in table.rows:
        row.cells[0].width = Cm(1.5)
        row.cells[1].width = Cm(3.5)
        row.cells[2].width = Cm(12)

    # Signature blocks for appendix too
    _add_paragraph(doc, "", space_after=12)
    _add_paragraph(doc,
        "Руководитель (уполномоченное лицо) органа по сертификации"
        "    _____________     М.П.  __________________",
        font_size=10, space_after=2)
    _add_paragraph(doc, "                                  (подпись)          (Ф.И.О.)",
                   font_size=9, space_after=8)
    _add_paragraph(doc,
        "Эксперт (эксперт-аудитор)"
        " (эксперты (эксперты-аудиторы)) _____________     М.П.     _________________",
        font_size=10, space_after=2)
    _add_paragraph(doc, "                                  (подпись)             (Ф.И.О.)",
                   font_size=9, space_after=0)

    buffer = BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def generate_maket_ds(data: dict) -> bytes:
    """
    Generate a Макет ДС document.

    Args:
        data: dict with keys matching MaketForm from the frontend.

    Returns:
        bytes of the .docx file.
    """
    doc = Document()

    # Set default font
    style = doc.styles["Normal"]
    font = style.font
    font.name = "Times New Roman"
    font.size = Pt(12)

    # Set narrow margins
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(1.5)

    # ===== PAGE 1: DECLARATION =====

    _add_paragraph(
        doc,
        "ЕВРАЗИЙСКИЙ ЭКОНОМИЧЕСКИЙ СОЮЗ",
        font_size=14,
        bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=4,
    )

    _add_paragraph(
        doc,
        "ДЕКЛАРАЦИЯ О СООТВЕТСТВИИ",
        font_size=14,
        bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=12,
    )

    # Applicant info
    applicant_type = data.get("applicantType", "ИП")
    applicant_name = data.get("applicantName", "")
    applicant_inn = data.get("applicantInn", "")
    applicant_okpo = data.get("applicantOkpo", "")
    applicant_address = data.get("applicantAddress", "")
    applicant_phone = data.get("applicantPhone", "")
    applicant_email = data.get("applicantEmail", "")

    applicant_full = f"{_company_prefix(applicant_type)} {applicant_name}"

    _add_paragraph(
        doc,
        f"Заявитель: {applicant_full},",
        space_after=2,
    )
    _add_paragraph(
        doc,
        f"ИНН {applicant_inn} ОКПО {applicant_okpo}",
        space_after=2,
    )
    _add_paragraph(
        doc,
        f"Место нахождения: Кыргызская Республика, {applicant_address}",
        space_after=2,
    )
    _add_paragraph(
        doc,
        f"телефон: {applicant_phone} электронная почта: {applicant_email}",
        space_after=2,
    )
    _add_paragraph(
        doc,
        f"в лице {applicant_name}",
        space_after=8,
    )

    # Product description
    weaving = data.get("productWeaving", "Трикотаж")
    layer = data.get("productLayer", "2")
    gender = data.get("productGender", "Женский")
    material = data.get("productMaterial", "")
    trademarks = data.get("productTrademarks", "")

    weaving_adj = _weaving_adj(weaving)
    gender_adj = _gender_adj(gender)
    tm_formatted = _format_trademarks(trademarks) if trademarks else ""

    product_desc = f"заявляет, что Изделия {weaving_adj} {layer} слоя {gender_adj} из {material}"
    if tm_formatted:
        product_desc += f", торговой марки {tm_formatted}"
    product_desc += "\nсогласно приложению на 2 листе(ах)"

    _add_paragraph(doc, product_desc, space_after=6)
    _add_paragraph(doc, "Серийный выпуск", space_after=6)
    _add_paragraph(
        doc,
        "Код ТН ВЭД согласно приложению на 2 листе(ах)",
        space_after=8,
    )

    # Manufacturer info
    same_as_applicant = data.get("sameAsApplicant", False)
    if same_as_applicant:
        mfr_type = applicant_type
        mfr_name = applicant_name
        mfr_address = applicant_address
    else:
        mfr_type = data.get("manufacturerType", "ИП")
        mfr_name = data.get("manufacturerName", "")
        mfr_address = data.get("manufacturerAddress", "")

    mfr_full = f"{_company_prefix(mfr_type)} {mfr_name}"
    mfr_prod_address = data.get("manufacturerProductionAddress", mfr_address) if not same_as_applicant else applicant_address

    _add_paragraph(
        doc,
        f"Изготовитель: {mfr_full}",
        space_after=2,
    )
    _add_paragraph(
        doc,
        f"Адрес места осуществления деятельности: Кыргызская Республика, {mfr_prod_address}",
        space_after=8,
    )

    # Conformity
    tr_ts = data.get("trTs", "017/2011")
    _add_paragraph(
        doc,
        f'Соответствует требованиям: ТР ТС {tr_ts} "О безопасности продукции легкой промышленности"',
        space_after=8,
    )

    # Protocol
    protocol_number = data.get("protocolNumber", "")
    _add_paragraph(
        doc,
        f"Декларация о соответствии принята на основании: Протокола испытаний {protocol_number}",
        space_after=6,
    )

    # Scheme
    scheme = data.get("declarationScheme", "3Д")
    _add_paragraph(
        doc,
        f"Схема декларирования: {scheme}",
        space_after=8,
    )

    # Additional info
    _add_paragraph(
        doc,
        "Дополнительная информация: Изделия должны храниться в сухом, проветриваемом "
        "помещении в соответствии с правилами пожарной безопасности в условиях, "
        "предотвращающих загрязнение, механические повреждения и действие солнечных лучей.",
        space_after=8,
    )

    # Validity
    valid_until = data.get("validUntil", "")
    _add_paragraph(
        doc,
        f"Декларация о соответствии действительна с даты регистрации по {valid_until} г. включительно.",
        space_after=12,
    )

    # Signature
    _add_paragraph(doc, "М.П.", space_after=2)
    _add_paragraph(doc, applicant_name, bold=True, space_after=0)

    # ===== PAGE BREAK =====
    doc.add_page_break()

    # ===== PAGE 2: APPENDIX =====

    _add_paragraph(
        doc,
        "ЕВРАЗИЙСКИЙ ЭКОНОМИЧЕСКИЙ СОЮЗ",
        font_size=14,
        bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=4,
    )

    _add_paragraph(
        doc,
        "ПРИЛОЖЕНИЕ К ДЕКЛАРАЦИИ О СООТВЕТСТВИИ",
        font_size=14,
        bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=12,
    )

    _add_paragraph(
        doc,
        "Перечень продукции, на которую распространяется действие декларации о соответствии",
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=12,
    )

    # Parse TNVED codes and product list
    tnved_codes_raw = data.get("tnvedCodes", "")
    product_list_raw = data.get("productList", "")

    tnved_lines = [line.strip() for line in tnved_codes_raw.strip().split("\n") if line.strip()]
    product_lines = [line.strip() for line in product_list_raw.strip().split("\n") if line.strip()]

    # Build table rows: match codes with products
    row_count = max(len(tnved_lines), len(product_lines), 1)

    table = doc.add_table(rows=row_count + 1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Header row
    headers = ["№", "Код ТН ВЭД ТС", "Наименование и обозначение продукции", "Количество"]
    header_row = table.rows[0]
    for i, header_text in enumerate(headers):
        cell = header_row.cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(header_text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        # Set borders
        _set_cell_border(
            cell,
            top={"sz": "6", "val": "single", "color": "000000"},
            bottom={"sz": "6", "val": "single", "color": "000000"},
            start={"sz": "6", "val": "single", "color": "000000"},
            end={"sz": "6", "val": "single", "color": "000000"},
        )

    # Data rows
    for row_idx in range(row_count):
        row = table.rows[row_idx + 1]
        code = tnved_lines[row_idx] if row_idx < len(tnved_lines) else ""
        product = product_lines[row_idx] if row_idx < len(product_lines) else ""

        values = [str(row_idx + 1), code, product, "Серийный выпуск"]
        for col_idx, val in enumerate(values):
            cell = row.cells[col_idx]
            cell.text = ""
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.name = "Times New Roman"
            run.font.size = Pt(10)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            _set_cell_border(
                cell,
                top={"sz": "4", "val": "single", "color": "000000"},
                bottom={"sz": "4", "val": "single", "color": "000000"},
                start={"sz": "4", "val": "single", "color": "000000"},
                end={"sz": "4", "val": "single", "color": "000000"},
            )

    # Set column widths
    for row in table.rows:
        row.cells[0].width = Cm(1.5)
        row.cells[1].width = Cm(4)
        row.cells[2].width = Cm(8)
        row.cells[3].width = Cm(3.5)

    _add_paragraph(doc, "", space_after=12)
    _add_paragraph(doc, "М.П.", space_after=2)
    _add_paragraph(doc, applicant_name, bold=True, space_after=0)

    # Serialize to bytes
    buffer = BytesIO()
    doc.save(buffer)
    return buffer.getvalue()
