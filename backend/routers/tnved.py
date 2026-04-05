from fastapi import APIRouter
from schemas import TnvedRequest, TnvedResponse
from services.tnved_resolver import resolve_tnved

router = APIRouter(prefix="/api/tnved", tags=["tnved"])


@router.post("/resolve", response_model=TnvedResponse)
def resolve(data: TnvedRequest):
    result = resolve_tnved(
        material_type=data.material_type,
        product_type=data.product_type,
        gender=data.gender,
        main_material=data.main_material,
    )
    return result
