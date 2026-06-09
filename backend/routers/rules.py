from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import schemas, crud

router = APIRouter(prefix="/api/rules", tags=["计算规则"])


@router.get("/", response_model=List[schemas.CalculationRule])
def read_rules(skip: int = 0, limit: int = 100, active_only: bool = True, db: Session = Depends(get_db)):
    try:
        return crud.get_rules(db, skip=skip, limit=limit, active_only=active_only)
    except Exception:
        return []


@router.get("/{rule_id}", response_model=schemas.CalculationRule)
def read_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = crud.get_rule(db, rule_id=rule_id)
    if db_rule is None:
        raise HTTPException(status_code=404, detail="计算规则不存在")
    return db_rule


@router.post("/", response_model=schemas.CalculationRule, status_code=status.HTTP_201_CREATED)
def create_rule(rule: schemas.CalculationRuleCreate, db: Session = Depends(get_db)):
    return crud.create_rule(db=db, rule=rule)


@router.put("/{rule_id}", response_model=schemas.CalculationRule)
def update_rule(rule_id: int, rule: schemas.CalculationRuleUpdate, db: Session = Depends(get_db)):
    db_rule = crud.update_rule(db, rule_id=rule_id, rule=rule)
    if db_rule is None:
        raise HTTPException(status_code=404, detail="计算规则不存在")
    return db_rule


@router.delete("/{rule_id}", response_model=schemas.MessageResponse)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    success = crud.delete_rule(db, rule_id=rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="计算规则不存在")
    return {"message": "计算规则删除成功"}
