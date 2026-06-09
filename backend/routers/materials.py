from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import schemas, crud

router = APIRouter(prefix="/api/materials", tags=["原料管理"])


@router.get("/", response_model=List[schemas.Material])
def read_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return crud.get_materials(db, skip=skip, limit=limit)
    except Exception:
        return []


@router.get("/{material_id}", response_model=schemas.Material)
def read_material(material_id: int, db: Session = Depends(get_db)):
    db_material = crud.get_material(db, material_id=material_id)
    if db_material is None:
        raise HTTPException(status_code=404, detail="原料不存在")
    return db_material


@router.post("/", response_model=schemas.Material, status_code=status.HTTP_201_CREATED)
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    return crud.create_material(db=db, material=material)


@router.put("/{material_id}", response_model=schemas.Material)
def update_material(material_id: int, material: schemas.MaterialUpdate, db: Session = Depends(get_db)):
    db_material = crud.update_material(db, material_id=material_id, material=material)
    if db_material is None:
        raise HTTPException(status_code=404, detail="原料不存在")
    return db_material


@router.delete("/{material_id}", response_model=schemas.MessageResponse)
def delete_material(material_id: int, db: Session = Depends(get_db)):
    success = crud.delete_material(db, material_id=material_id)
    if not success:
        raise HTTPException(status_code=404, detail="原料不存在")
    return {"message": "原料删除成功"}
