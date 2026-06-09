from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import schemas, crud

router = APIRouter(tags=["配方管理"])


@router.post("/api/products/{product_id}/recipes/", response_model=schemas.Recipe)
def add_recipe_to_product(product_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = crud.add_recipe(db, product_id=product_id, recipe=recipe)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="商品不存在")
    return db_recipe


@router.put("/api/recipes/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = crud.update_recipe(db, recipe_id=recipe_id, recipe=recipe)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="配方不存在")
    return db_recipe


@router.delete("/api/recipes/{recipe_id}", response_model=schemas.MessageResponse)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    success = crud.delete_recipe(db, recipe_id=recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="配方不存在")
    return {"message": "配方删除成功"}
