from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO
import re

from services.maket_generator import generate_maket_ds, generate_maket_cc

router = APIRouter(prefix="/api/maket", tags=["maket"])


class MaketRequest(BaseModel):
    # Applicant
    applicantType: str = "ИП"
    applicantName: str = ""
    applicantInn: str = ""
    applicantOkpo: str = ""
    applicantAddress: str = ""
    applicantPhone: str = ""
    applicantEmail: str = ""
    # Manufacturer
    sameAsApplicant: bool = False
    manufacturerType: str = "ИП"
    manufacturerName: str = ""
    manufacturerInn: str = ""
    manufacturerAddress: str = ""
    manufacturerProductionAddress: str = ""
    # Product
    productWeaving: str = "Трикотаж"
    productLayer: str = "2"
    productGender: str = "Женский"
    productMaterial: str = ""
    productTrademarks: str = ""
    productList: str = ""
    tnvedCodes: str = ""
    # Document
    trTs: str = "017/2011"
    protocolNumber: str = ""
    declarationScheme: str = "3Д"
    validUntil: str = ""


@router.post("/ds")
def generate_ds(data: MaketRequest):
    """Generate a Макет ДС .docx document."""
    try:
        content = generate_maket_ds(data.model_dump())
    except Exception as e:
        raise HTTPException(500, f"Ошибка генерации документа: {str(e)}")

    filename = f"maket_ds_{data.applicantName or 'document'}.docx"
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.post("/cc")
def generate_cc(data: MaketRequest):
    """Generate a Макет СС .docx document."""
    try:
        content = generate_maket_cc(data.model_dump())
    except Exception as e:
        raise HTTPException(500, f"Ошибка генерации документа: {str(e)}")

    filename = f"maket_cc_{data.applicantName or 'document'}.docx"
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.post("/parse-tz")
async def parse_tz(file: UploadFile = File(...)):
    """
    Parse a filled ТЗ .docx file and extract fields to auto-fill the Maket form.
    Returns JSON with extracted data.
    """
    if not file.filename.endswith('.docx'):
        raise HTTPException(400, "Файл должен быть .docx")

    try:
        from docx import Document as DocxDocument

        content = await file.read()
        doc = DocxDocument(BytesIO(content))

        # Extract all text
        lines = []
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                lines.append(text)

        full_text = "\n".join(lines)

        result = {
            "applicantType": "ИП",
            "applicantName": "",
            "applicantInn": "",
            "applicantPhone": "",
            "applicantEmail": "",
            "applicantAddress": "",
            "applicantOkpo": "",
            "manufacturerType": "ИП",
            "manufacturerName": "",
            "manufacturerInn": "",
            "manufacturerAddress": "",
            "manufacturerProductionAddress": "",
            "productWeaving": "",
            "productLayer": "",
            "productGender": "",
            "productMaterial": "",
            "productTrademarks": "",
            "productList": "",
            "tnvedCodes": "",
            "sameAsApplicant": False,
        }

        # Parse sections by looking at known field patterns
        section = None
        for line in lines:
            low = line.lower().strip()

            # Section detection
            if "заявитель" in low and ("продукция" not in low):
                section = "applicant"
                continue
            if "изготовитель" in low:
                section = "manufacturer"
                continue
            if "ассортимент" in low or "перечень" in low:
                section = "assortment"
                continue
            if "продукция" in low and ("какие" in low or "изделия" in low):
                section = "product_info"
                continue
            if "оплата" in low:
                section = "payment"
                continue
            if "вид документа" in low:
                section = "doc_type"
                continue

            # Extract specific fields

            # INN
            inn_match = re.search(r'ИНН\s*:?\s*(\d{10,14})', line)
            if inn_match:
                if section == "manufacturer":
                    result["manufacturerInn"] = inn_match.group(1)
                else:
                    result["applicantInn"] = inn_match.group(1)

            # ОКПО
            okpo_match = re.search(r'ОКПО\s*:?\s*(\d+)', line)
            if okpo_match:
                result["applicantOkpo"] = okpo_match.group(1)

            # Phone
            phone_match = re.search(r'\+996[\s\d-]+', line)
            if phone_match:
                result["applicantPhone"] = phone_match.group(0).strip()

            # Email
            email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', line)
            if email_match:
                result["applicantEmail"] = email_match.group(0)

            # Company type detection
            if "ОсОО" in line or "ОсОо" in line or "осоо" in low:
                if section == "manufacturer":
                    result["manufacturerType"] = "ОсОО"
                else:
                    result["applicantType"] = "ОсОО"

            # Company/person name after ИП/ОсОО
            name_match = re.search(r'(?:ИП|ОсОО)\s*[«"]?\s*(.+?)[»"]?\s*$', line)
            if name_match and "название" in low:
                name_val = name_match.group(1).strip().rstrip('?')
                if name_val and len(name_val) > 2:
                    if section == "manufacturer":
                        result["manufacturerName"] = name_val
                    else:
                        result["applicantName"] = name_val

            # Addresses - detect by keyword
            if "адрес" in low:
                # Extract text after colon
                addr_match = re.search(r'адрес.*?:\s*(.+)', line, re.IGNORECASE)
                if addr_match:
                    addr = addr_match.group(1).strip()
                    if addr and len(addr) > 3 and "свидетельств" not in addr:
                        if section == "manufacturer":
                            if "производств" in low:
                                result["manufacturerProductionAddress"] = addr
                            else:
                                result["manufacturerAddress"] = addr
                        else:
                            result["applicantAddress"] = addr

            # Weaving type
            if "трикотаж" in low:
                result["productWeaving"] = "Трикотаж"
            elif "швейка" in low or "швейн" in low:
                result["productWeaving"] = "Швейка"

            # Layer
            layer_match = re.search(r'слой.*?(\d)', low)
            if layer_match:
                result["productLayer"] = layer_match.group(1)

            # Gender/Target
            if "детск" in low:
                result["productGender"] = "Детский"
            elif "взросл" in low:
                if "женск" in low:
                    result["productGender"] = "Женский"
                elif "мужск" in low:
                    result["productGender"] = "Мужской"
                else:
                    result["productGender"] = "Женский"

            # Trademarks
            tm_matches = re.findall(r'[«"](.*?)[»"]', line)
            if tm_matches and section in ("assortment", "product_info"):
                existing = result["productTrademarks"]
                new_tms = ", ".join(tm_matches)
                result["productTrademarks"] = f"{existing}, {new_tms}".strip(", ") if existing else new_tms

            # TNVED codes
            tnved_match = re.findall(r'\b\d{4}\s*\d{2}\s*\d{3}\s*\d\b', line)
            if tnved_match:
                existing = result["tnvedCodes"]
                new_codes = "\n".join(tnved_match)
                result["tnvedCodes"] = f"{existing}\n{new_codes}".strip() if existing else new_codes

            # Composition
            if "состав" in low and "%" in line:
                result["productMaterial"] = line.split(":")[-1].strip() if ":" in line else ""

        return result

    except Exception as e:
        raise HTTPException(500, f"Ошибка парсинга ТЗ: {str(e)}")
