# 成本计算工具

一个功能完整的商品成本计算工具，使用 FastAPI + 原生 HTML/CSS/JS + MySQL 开发。

## 功能特性

- 📦 商品管理 - 添加、编辑、删除商品，设置人工成本和税率
- 🧪 原料管理 - 管理商品原料信息
- 📋 配方管理 - 为商品配置原料配方
- 💰 成本计算 - 单个商品成本计算和批量计算
- 🎯 计算规则 - 支持灵活的成本优惠规则（满45单减1元等）
- 📊 计算历史 - 查看历史计算记录
- 🎨 简洁界面 - 美观的响应式界面，包含加载动画
- 📱 矢量图标 - 全部使用 SVG 矢量图标

## 技术栈

- **后端**: FastAPI + SQLAlchemy + PyMySQL
- **前端**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **数据库**: MySQL 5.7+
- **其他**: Pydantic (数据验证), python-dotenv (配置管理)

## 项目结构

```
Cost/
├── backend/              # 后端代码
│   ├── __init__.py
│   ├── config.py         # 配置管理
│   ├── database.py       # 数据库连接
│   ├── models.py         # 数据模型
│   ├── schemas.py        # Pydantic Schema
│   ├── crud.py           # 数据库操作
│   ├── calculator.py     # 成本计算引擎
│   └── main.py           # FastAPI 主程序
├── frontend/             # 前端代码
│   ├── index.html        # 主页面
│   ├── css/
│   │   └── style.css     # 样式文件
│   └── js/
│       ├── api.js        # API 封装
│       └── app.js        # 应用逻辑
├── .env                  # 环境配置
├── requirements.txt      # Python 依赖
├── main.py               # 启动脚本
├── init_db.py            # 数据库初始化
└── README.md             # 说明文档
```

## 快速开始

### 1. 环境要求

- Python 3.8+
- MySQL 5.7+
- Windows 操作系统

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置数据库

编辑 `.env` 文件，配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=122588
DB_NAME=cost_calculator
```

### 4. 初始化数据库

```bash
python init_db.py
```

### 5. 启动应用

```bash
python main.py
```

### 6. 访问应用

- 应用首页: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 使用说明

### 第一步：添加原料

进入「原料管理」页面，点击「添加原料」，填写原料信息（名称、单位、单价、描述）。

### 第二步：添加商品

进入「商品管理」页面，点击「添加商品」：
- 填写商品基本信息
- 设置人工成本和税率
- 配置配方：添加原料并设置用量

### 第三步：成本计算

进入「成本计算」页面：
- 选择商品和数量，点击「计算单个商品」
- 或者选择多个商品，点击「批量计算」

### 第四步：查看历史

进入「计算历史」页面，查看所有计算记录。

### 第五步：规则管理

进入「规则管理」页面，可以添加、编辑、删除计算规则。系统默认会创建「满45单减1元」的规则。

## 数据库表结构

### materials (原料表)
- id: 主键
- name: 原料名称
- unit: 单位
- price: 单价
- description: 描述
- created_at: 创建时间
- updated_at: 更新时间

### products (商品表)
- id: 主键
- name: 商品名称
- labor_cost: 人工成本
- tax_rate: 税率
- description: 描述
- created_at: 创建时间
- updated_at: 更新时间

### recipes (配方表)
- id: 主键
- product_id: 商品ID (外键)
- material_id: 原料ID (外键)
- quantity: 用量

### calculation_rules (计算规则表)
- id: 主键
- name: 规则名称
- rule_type: 规则类型 (quantity_discount/total_cost_discount)
- conditions: 规则条件 (JSON)
- actions: 规则动作 (JSON)
- is_active: 是否启用
- priority: 优先级
- description: 描述
- created_at: 创建时间
- updated_at: 更新时间

### calculation_history (计算历史表)
- id: 主键
- product_id: 商品ID (外键)
- quantity: 数量
- material_cost: 材料成本
- labor_cost: 人工成本
- tax_cost: 税费
- discount: 优惠金额
- total_cost: 总成本
- unit_cost: 单位成本
- details: 详细信息 (JSON)
- applied_rules: 应用的规则 (JSON)
- created_at: 创建时间

## 开发说明

### 后端 API

主要 API 端点：

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/materials | 获取原料列表 |
| POST | /api/materials | 创建原料 |
| PUT | /api/materials/{id} | 更新原料 |
| DELETE | /api/materials/{id} | 删除原料 |
| GET | /api/products | 获取商品列表 |
| POST | /api/products | 创建商品 |
| PUT | /api/products/{id} | 更新商品 |
| DELETE | /api/products/{id} | 删除商品 |
| POST | /api/calculate | 计算单个商品成本 |
| POST | /api/calculate/batch | 批量计算成本 |
| GET | /api/history | 获取计算历史 |
| GET | /api/rules | 获取计算规则 |
| POST | /api/rules | 创建计算规则 |
| PUT | /api/rules/{id} | 更新计算规则 |
| DELETE | /api/rules/{id} | 删除计算规则 |

### 前端开发

前端使用原生 JavaScript，无需构建工具，直接在浏览器中运行即可。

## 配置管理

所有配置项都在 `.env` 文件中，严禁在代码中硬编码敏感信息。

## 许可证

MIT License
