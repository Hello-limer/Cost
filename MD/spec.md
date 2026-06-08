# 成本计算工具 - 产品需求文档

## Overview
- **Summary**: 开发一个功能完整的商品成本计算工具，支持Windows部署，提供商品/原料管理、成本计算、批量处理、历史记录和灵活规则设置等功能。
- **Purpose**: 为用户提供一个便捷的成本计算工具，帮助管理商品、原料和配方，并支持灵活的成本计算规则。
- **Target Users**: 小型企业主、个体经营者、手工制作者等需要计算商品成本的用户。

## Goals
- 提供直观易用的用户界面
- 仅支持Windows平台部署
- 实现商品和原料管理功能
- 支持灵活的成本计算规则
- 提供历史记录功能
- 支持批量计算
- 采用FastAPI + 原生HTML/CSS/JS技术栈
- 使用MySQL数据库存储数据


## Background & Context
用户需要一个成本计算工具，采用Web架构，后端使用FastAPI，前端使用原生HTML/CSS/JS，数据库使用MySQL。所有数据库连接配置等严禁硬编码，应通过配置文件管理。

## Functional Requirements
- **FR-1**: 商品和原料管理 - 用户可以添加、编辑、删除商品和原料信息
- **FR-2**: 成本计算 - 支持单个商品成本计算，包括材料成本、人工成本、税费等
- **FR-3**: 批量计算 - 支持多个商品同时计算成本
- **FR-4**: 计算规则 - 支持灵活的规则设置（如满一定数量后成本减免）
- **FR-5**: 历史记录 - 保存计算历史，支持查看和导出
- **FR-6**: 配置管理 - 所有配置项（数据库连接等）通过配置文件管理，禁止硬编码

## Non-Functional Requirements
- **NFR-1**: 响应速度 - 主要操作（计算、保存）响应时间 < 1秒
- **NFR-2**: 可用性 - 界面直观，新用户可在 5 分钟内上手
- **NFR-3**: 界面设计 - 界面简洁，包含加载动画，美观流畅，只允许使用矢量图标
- **NFR-4**: 配置管理 - 所有敏感配置（数据库密码等）通过配置文件管理，严禁硬编码

## Constraints
- **Technical**: 后端使用FastAPI，前端使用原生HTML/CSS/JS，数据库使用MySQL
- **Business**: 仅支持Windows平台部署，后续考虑Android平台支持
- **Dependencies**: FastAPI, MySQL Connector, MySQL数据库（账号: root, 密码: 122588）

## Assumptions
- 用户设备已安装MySQL数据库
- 用户具备基本的计算机操作能力
- 系统有足够的存储空间

## Acceptance Criteria

### AC-1: 商品和原料管理
- **Given**: 用户打开应用
- **When**: 用户添加、编辑或删除商品/原料
- **Then**: 操作成功，数据正确保存到MySQL数据库
- **Verification**: `programmatic`

### AC-2: 单个商品成本计算
- **Given**: 用户已添加商品和原料
- **When**: 用户选择商品进行成本计算
- **Then**: 正确计算并显示商品成本明细
- **Verification**: `programmatic`

### AC-3: 批量计算
- **Given**: 用户已添加多个商品
- **When**: 用户选择多个商品进行批量计算
- **Then**: 成功计算所有选中商品的成本并展示结果
- **Verification**: `programmatic`

### AC-4: 计算规则应用
- **Given**: 用户已设置计算规则（如满45单后成本减一）
- **When**: 用户计算符合规则条件的商品
- **Then**: 规则正确应用，计算结果符合预期
- **Verification**: `programmatic`

### AC-5: 历史记录
- **Given**: 用户已进行过多次计算
- **When**: 用户查看历史记录
- **Then**: 显示完整的计算历史，支持查看详情
- **Verification**: `programmatic`

### AC-6: 配置管理
- **Given**: 应用已部署
- **When**: 检查代码和配置
- **Then**: 所有配置项（数据库连接、密码等）都在配置文件中，代码中无硬编码
- **Verification**: `programmatic`

### AC-7: 界面设计
- **Given**: 用户打开应用
- **When**: 用户操作各个功能模块
- **Then**: 界面简洁流畅，有加载动画，只使用矢量图标
- **Verification**: `human-judgment`

## Open Questions
- [ ] 数据导出格式需求（Excel、PDF、CSV）？
- [ ] 是否需要数据备份和恢复功能？
