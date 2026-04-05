from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime, timedelta
import os


def _register_fonts():
    """Register a Cyrillic-capable font for PDF generation."""
    font_paths = [
        "C:/Windows/Fonts/times.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            name = os.path.splitext(os.path.basename(path))[0]
            try:
                pdfmetrics.registerFont(TTFont(name, path))
                return name
            except Exception:
                continue
    return "Helvetica"


def generate_docx(certificate: dict, client: dict, products: list[dict]) -> bytes:
    """Генерация DOCX сертификата/декларации."""
    doc = Document()

    style = doc.styles["Normal"]
    font = style.font
    font.name = "Times New Roman"
    font.size = Pt(12)

    # Header
    doc_type_name = "СЕРТИФИКАТ СООТВЕТСТВИЯ" if certificate["doc_type"] == "CC" else "ДЕКЛАРАЦИЯ О СООТВЕТСТВИИ"
    tr_ts = certificate["tr_ts"]
    tr_name = "ТР ТС 007/2011" if "007" in tr_ts else "ТР ТС 017/2011"

    heading = doc.add_heading(doc_type_name, level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph(f"Технический регламент: {tr_name}")
    doc.add_paragraph("")

    # Applicant info
    doc.add_heading("Заявитель", level=2)
    doc.add_paragraph(f"ФИО: {client['fio']}")
    doc.add_paragraph(f"ИНН: {client['inn']}")
    if client.get("okpo"):
        doc.add_paragraph(f"ОКПО: {client['okpo']}")
    if client.get("legal_address"):
        doc.add_paragraph(f"Юридический адрес: {client['legal_address']}")
    if client.get("workshop_address"):
        doc.add_paragraph(f"Адрес производства: {client['workshop_address']}")
    if client.get("phone"):
        doc.add_paragraph(f"Телефон: {client['phone']}")
    if client.get("email"):
        doc.add_paragraph(f"Email: {client['email']}")

    doc.add_paragraph("")

    # Products
    doc.add_heading("Продукция", level=2)

    table = doc.add_table(rows=1, cols=5)
    table.style = "Table Grid"
    headers = ["Артикул", "Наименование", "Тип", "Состав", "Код ТН ВЭД"]
    for i, h in enumerate(headers):
        table.rows[0].cells[i].text = h

    for prod in products:
        row = table.add_row()
        row.cells[0].text = prod.get("article", "")
        row.cells[1].text = prod.get("name", "")
        row.cells[2].text = prod.get("product_type", "")

        compositions = prod.get("compositions", [])
        comp_str = ", ".join(f"{c['material_name']} {c['percentage']}%" for c in compositions)
        row.cells[3].text = comp_str

        row.cells[4].text = prod.get("tnved_code", "")

    doc.add_paragraph("")

    # Certificate details
    doc.add_heading("Сведения о сертификации", level=2)
    start_date = datetime.now()
    end_date = start_date + timedelta(days=365 * certificate["duration_years"])
    doc.add_paragraph(f"Срок действия: с {start_date.strftime('%d.%m.%Y')} по {end_date.strftime('%d.%m.%Y')}")
    doc.add_paragraph(f"Количество протоколов испытаний: {certificate['protocol_count']}")
    doc.add_paragraph(f"Стоимость: {certificate['total_price']:,.0f} руб.")

    buf = BytesIO()
    doc.save(buf)
    return buf.getvalue()


def generate_pdf(certificate: dict, client: dict, products: list[dict]) -> bytes:
    """Генерация PDF сертификата/декларации."""
    buf = BytesIO()
    font_name = _register_fonts()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    y = height - 2 * cm

    def draw_text(text, x=2 * cm, size=12, bold=False):
        nonlocal y
        c.setFont(font_name, size)
        c.drawString(x, y, text)
        y -= size + 6

    # Title
    doc_type_name = "СЕРТИФИКАТ СООТВЕТСТВИЯ" if certificate["doc_type"] == "CC" else "ДЕКЛАРАЦИЯ О СООТВЕТСТВИИ"
    draw_text(doc_type_name, x=width / 2 - 4 * cm, size=16, bold=True)
    y -= 10

    tr_ts = certificate["tr_ts"]
    tr_name = "ТР ТС 007/2011" if "007" in tr_ts else "ТР ТС 017/2011"
    draw_text(f"Технический регламент: {tr_name}")
    y -= 10

    # Applicant
    draw_text("ЗАЯВИТЕЛЬ:", size=14)
    draw_text(f"ФИО: {client['fio']}")
    draw_text(f"ИНН: {client['inn']}")
    if client.get("legal_address"):
        draw_text(f"Адрес: {client['legal_address']}")
    y -= 10

    # Products
    draw_text("ПРОДУКЦИЯ:", size=14)
    for prod in products:
        compositions = prod.get("compositions", [])
        comp_str = ", ".join(f"{co['material_name']} {co['percentage']}%" for co in compositions)
        draw_text(f"  {prod['article']} — {prod['name']} ({prod['product_type']})")
        if comp_str:
            draw_text(f"    Состав: {comp_str}")
        if prod.get("tnved_code"):
            draw_text(f"    Код ТН ВЭД: {prod['tnved_code']}")

        if y < 3 * cm:
            c.showPage()
            y = height - 2 * cm

    y -= 10

    # Details
    start_date = datetime.now()
    end_date = start_date + timedelta(days=365 * certificate["duration_years"])
    draw_text(f"Срок действия: {start_date.strftime('%d.%m.%Y')} — {end_date.strftime('%d.%m.%Y')}")
    draw_text(f"Протоколов испытаний: {certificate['protocol_count']}")
    draw_text(f"Стоимость: {certificate['total_price']:,.0f} руб.")

    c.save()
    return buf.getvalue()
