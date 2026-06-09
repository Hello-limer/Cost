from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import schemas, crud

router = APIRouter(prefix="/api/history", tags=["计算历史"])


@router.get("/", response_model=List[schemas.CalculationHistoryResponse])
def read_calculation_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    histories = crud.get_calculation_history(db, skip=skip, limit=limit)
    response_list = []
    for history in histories:
        product_name = history.product.name if history.product else None
        response_list.append(schemas.CalculationHistoryResponse(
            id=history.id,
            product_id=history.product_id,
            product_name=product_name,
            quantity=history.quantity,
            material_cost=history.material_cost,
            labor_cost=history.labor_cost,
            tax_cost=history.tax_cost,
            discount=history.discount,
            total_cost=history.total_cost,
            unit_cost=history.unit_cost,
            details=history.details,
            applied_rules=history.applied_rules,
            created_at=history.created_at
        ))
    return response_list


@router.get("/{history_id}", response_model=schemas.CalculationHistoryResponse)
def read_calculation_history_item(history_id: int, db: Session = Depends(get_db)):
    history = crud.get_calculation_history_by_id(db, history_id=history_id)
    if history is None:
        raise HTTPException(status_code=404, detail="计算历史不存在")
    product_name = history.product.name if history.product else None
    return schemas.CalculationHistoryResponse(
        id=history.id,
        product_id=history.product_id,
        product_name=product_name,
        quantity=history.quantity,
        material_cost=history.material_cost,
        labor_cost=history.labor_cost,
        tax_cost=history.tax_cost,
        discount=history.discount,
        total_cost=history.total_cost,
        unit_cost=history.unit_cost,
        details=history.details,
        applied_rules=history.applied_rules,
        created_at=history.created_at
    )
