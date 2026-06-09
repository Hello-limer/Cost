from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import schemas, calculator as calc_module

router = APIRouter(prefix="/api/calculate", tags=["成本计算"])


@router.post("/", response_model=schemas.CostCalculationResult)
def calculate_cost(request: schemas.CostCalculationRequest, db: Session = Depends(get_db)):
    calc = calc_module.CostCalculator(db)
    try:
        return calc.calculate_product_cost(request.product_id, request.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch/", response_model=schemas.BatchCostCalculationResult)
def calculate_batch_cost(request: schemas.BatchCostCalculationRequest, db: Session = Depends(get_db)):
    calc = calc_module.CostCalculator(db)
    return calc.calculate_batch_cost(request.items)
