# 项目模块化架构文档

## 后端架构 (FastAPI)

### 目录结构
```
backend/
├── __init__.py
├── main.py              # 应用入口
├── config.py            # 配置管理
├── database.py          # 数据库连接
├── models.py            # ORM模型
├── schemas.py           # Pydantic验证模型
├── crud.py              # 数据库操作
├── calculator.py        # 成本计算逻辑
├── init_db.py           # 数据库初始化
└── routers/             # API路由模块
    ├── __init__.py
    ├── materials.py     # 原料管理API
    ├── products.py      # 商品管理API
    ├── recipes.py       # 配方管理API
    ├── rules.py         # 计算规则API
    ├── calculator.py    # 成本计算API
    ├── history.py       # 计算历史API
    └── system.py        # 系统API
```

### 依赖关系图
```
main.py (应用入口)
  ├── config.py (配置)
  ├── database.py (数据库)
  ├── models.py (模型)
  ├── routers/ (路由模块)
  │   ├── materials.py
  │   ├── products.py
  │   ├── recipes.py
  │   ├── rules.py
  │   ├── calculator.py
  │   ├── history.py
  │   └── system.py
  │       └── crud.py
  │           └── calculator.py
  └── crud.py (数据访问)
      └── models.py
          └── schemas.py
```

## 前端架构 (原生HTML/CSS/JS)

### 目录结构
```
frontend/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── api.js              # API调用封装
    ├── app.js              # 应用入口
    └── modules/            # 功能模块
        ├── state.js        # 全局状态管理
        ├── ui.js           # UI工具函数
        ├── navigation.js   # 导航逻辑
        ├── materials.js    # 原料管理
        ├── products.js     # 商品管理
        ├── rules.js        # 规则管理
        ├── calculator.js   # 成本计算
        └── history.js      # 计算历史
```

### 依赖关系图
```
app.js (入口)
  ├── navigation.js (导航)
  ├── materials.js (原料)
  │   ├── state.js (状态)
  │   ├── ui.js (UI工具)
  │   └── api.js (API)
  ├── products.js (商品)
  │   ├── state.js
  │   ├── ui.js
  │   └── api.js
  ├── rules.js (规则)
  │   ├── state.js
  │   ├── ui.js
  │   └── api.js
  ├── calculator.js (计算)
  │   ├── state.js
  │   ├── ui.js
  │   └── api.js
  ├── history.js (历史)
  │   ├── state.js
  │   ├── ui.js
  │   └── api.js
  ├── state.js (全局状态)
  └── ui.js (UI工具)
      └── api.js
```

## 模块化原则

1. **单一职责**：每个模块只负责一个功能领域
2. **低耦合**：模块间依赖最小化，通过明确的接口通信
3. **高内聚**：相关功能紧密组织在同一模块内
4. **可复用性**：模块设计便于独立复用
5. **可测试性**：模块独立便于单元测试
