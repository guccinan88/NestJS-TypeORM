# SolarMaterialsRequest

## Description

- 供使用者申請SAP料號，申請過程中可以替使用者檢核物料正確性
- 簽核完成後透過RFC送進SAP新增此料號

## 套件

- @nestjs/config
- @nestjs/axios
- cookie-parser
- @nestjs/swagger
- lodash
- rxjs
- TypeORM
- mssql
- pg
- dotenv

## material-request-api

### Controller

- **GET** /template-code
- **GET** /template-items
- **GET** /drawing-code
- **GET** /component-code
- **GET** /query-request-materials
- **GET** /query-request-form
- **GET** /query-details
- **GET** /lov-list
- **GET** /submit-form
- **GET** /query-form
- **POST** /create-form
- **PATCH** /edit-form
- **DELETE** /delete-form

### Module

- material-request
- sap-rfc

### Service

- auth-service
- material-request
- data-source
- sap-rfc

### Entity

- material-template.entity
- material-rule.entity
- material-lov-data.entity
- fcc-drawing-code.entity
- tem-drawing-code.entity
- component-code.entity
- material-request-form-master.entity
- material-request-form-items.entity
- material-request-catalog.entity
- material-request-plant.entity
- material-request-items-uom.entity
- material-automap.entity

### Guards

- auth.guard

## 修改紀錄

### 2024

- 12.20 SQL原生查詢轉TypeORM
- 12.30 修正MRP資料拆分儲存錯誤
- 12.31 修正批次特性儲存與取得所發生的Error

### 2025

- 01.02 增加取得SAP DATA靜態欄位資料API
- 01.08 增加複製料號需取得的欄位
- 01.08 增加SAP DATA取得資料為undefined或null錯誤防守機制
- 01.09 查詢清單增加Order By功能
- 01.09 查詢清單增加Page功能
- 01.14 修改採購類型/特殊採購類型新增與編輯的產生邏輯
- 01.14 修正採購類型/特殊採購類型變數命名(新增與編輯變數一致)
- 01.15 增加圖號顯示API欄位(oldDrawingCode)
- 01.15 增加PM2佈署用組態
- 01.21 建立與回靶Rule Table對應的TypeORM
- 01.22 建立產生回靶基礎資料(MARA)功能

## Note

- 未來若負載量過大，把pm2的運行模式調整成Cluster
