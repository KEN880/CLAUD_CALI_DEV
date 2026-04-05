from fastapi import APIRouter
from schemas import CalcRequest, CalcResponse
from services.pricing import calculate_price

router = APIRouter(prefix="/api/calculator", tags=["calculator"])


@router.post("/", response_model=CalcResponse)
def calc(data: CalcRequest):
    result = calculate_price(
        country_type=data.country_type,
        doc_type=data.doc_type,
        protocol_count=data.protocol_count,
        duration_years=data.duration_years,
    )
    return result
