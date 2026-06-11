from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend import schemas, crud

router = APIRouter(prefix="/api/history", tags=["计算历史"])


class PaginatedHistoryResponse(BaseModel):
    items: List[schemas.CalculationHistoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


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


@router.get("/paginated/", response_model=PaginatedHistoryResponse)
def read_calculation_history_paginated(page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    skip = (page - 1) * page_size
    total = crud.get_calculation_history_count(db)
    histories = crud.get_calculation_history(db, skip=skip, limit=page_size)
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
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1
    return PaginatedHistoryResponse(
        items=response_list,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.delete("/")
def delete_all_history(db: Session = Depends(get_db)):
    count = crud.delete_all_calculation_history(db)
    return {"message": f"已清空 {count} 条计算历史", "deleted_count": count}


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
