from fastapi import APIRouter
from pydantic import BaseModel
from schemas import TnvedRequest, TnvedResponse
from services.tnved_resolver import resolve_tnved, determine_layer

router = APIRouter(prefix="/api/tnved", tags=["tnved"])


@router.post("/resolve", response_model=TnvedResponse)
def resolve(data: TnvedRequest):
    result = resolve_tnved(
        weaving_type=data.material_type,
        product_type=data.product_type,
        gender=data.gender,
        main_material=data.main_material,
    )
    return result


class LayerRequest(BaseModel):
    product_type: str


class LayerResponse(BaseModel):
    layer: int
    description: str


@router.post("/layer", response_model=LayerResponse)
def get_layer(data: LayerRequest):
    layer = determine_layer(data.product_type)
    descriptions = {
        1: "1 слой — нательное бельё, непосредственный контакт с кожей",
        2: "2 слой — ограниченный контакт с кожей (платья, брюки, свитера)",
        3: "3 слой — верхняя одежда (пальто, куртки, плащи)",
    }
    return {"layer": layer, "description": descriptions.get(layer, "")}
