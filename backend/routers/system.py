from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import schemas, crud

router = APIRouter(tags=["系统"])


@router.post("/api/init-default-rules/", response_model=schemas.MessageResponse)
def init_default_rules(db: Session = Depends(get_db)):
    existing_rules = crud.get_rules(db, active_only=False)
    if existing_rules:
        return {"message": "规则已存在，跳过初始化"}
    default_rule = schemas.CalculationRuleCreate(
        name="批量优惠 - 满45单减1元",
        rule_type="quantity_discount",
        conditions={"min_quantity": 45},
        actions={"discount_per_unit": 1.0},
        is_active=1,
        priority=1,
        description="当计算数量达到或超过45时，每单位商品优惠1元"
    )
    crud.create_rule(db, default_rule)
    return {"message": "默认规则初始化成功"}
