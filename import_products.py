#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
商品数据导入脚本
删除现有商品并导入新商品数据
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal
from backend import models

# 商品数据
products_data = [
    # 谷物饭系列
    ("招牌岩烧鸡胸谷物饭", 7.0),
    ("板烧腿扒谷物饭", 10.0),
    ("黑椒鸭胸谷物饭", 10.0),
    ("沙县轻卤鸡腿饭", 10.0),
    ("孜然牛肉谷物饭", 15.0),
    ("黑椒牛肉谷物饭", 15.0),
    
    # 拌饭系列
    ("杂粮时蔬火腿拌饭", 10.0),
    ("黑椒鸡排时蔬拌饭", 10.0),
    ("藤椒腿扒时蔬拌饭", 11.0),
    ("滑蛋蟹柳时蔬拌饭", 11.0),
    ("低卡蒲烧秋刀鱼拌饭", 14.0),
    
    # 沙拉系列
    ("招牌蔬菜沙拉", 7.0),
    ("和风藜麦鸡丝沙拉", 10.0),
    ("香橙鸭胸蔬菜沙拉", 12.0),
    ("帕斯雀牛肉藜麦沙拉", 15.0),
    ("藜麦鲜虾滑蛋波奇碗", 15.0),
    
    # 面类系列
    ("黑椒鸡排葱油荞麦面", 10.0),
    ("番茄罗勒肉酱意面", 11.0),
    
    # 三明治系列
    ("芒果鸡排三明治", 11.0),
    ("滑蛋蟹柳厚切三明治", 10.0),
    ("板烧腿扒三明治", 10.0),
    ("时蔬鸡肉卷", 6.0),
    ("蟹柳菠菜卷", 7.0),
    
    # 饮品系列
    ("西柚火龙果汁", 9.0),
    ("香浓玉米汁", 8.0),
    ("羽衣甘蓝苹果梨汁", 10.0),
]


def import_products():
    """导入商品数据"""
    db = SessionLocal()
    try:
        print("=" * 50)
        print("开始导入商品数据...")
        print("=" * 50)
        
        # 删除所有现有商品
        # 先删除计算历史（因为有外键约束）
        print("\n1. 删除计算历史...")
        deleted_history = db.query(models.CalculationHistory).delete()
        db.commit()
        print(f"   已删除 {deleted_history} 条计算历史")
        
        # 删除所有现有商品
        print("\n2. 删除现有商品...")
        deleted_count = db.query(models.Product).delete()
        db.commit()
        print(f"   已删除 {deleted_count} 个商品")
        
        # 导入新商品
        print("\n3. 导入新商品...")
        import_count = 0
        for name, labor_cost in products_data:
            product = models.Product(
                name=name,
                labor_cost=labor_cost,
                tax_rate=0.0,  # 默认税率为0
                description=""
            )
            db.add(product)
            import_count += 1
            # 避免编码问题，不打印名称
            print(f"   已添加商品 {import_count}")
        
        db.commit()
        
        print("\n" + "=" * 50)
        print(f"导入完成！共导入 {import_count} 个商品")
        print("=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"\n错误: {e}")
        return False
    finally:
        db.close()
    
    return True


if __name__ == "__main__":
    import_products()
