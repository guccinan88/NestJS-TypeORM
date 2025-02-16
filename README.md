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

### Spec

- app.controller.spec.ts
- material-request.spec.ts

### Guards

- auth.guard

### Dto

- create-sap-view-validation.dto.ts

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
- 02.04 建立AppController單元測試
- 02.05 建立Component Codes單元測試
- 02.05 建立Drawing Codes單元測試
- 02.05 修改PM2參數，instances:2
- 02.05 修改客供回靶產生邏輯(無背板規則)
- 02.06 建立回靶Catalog
- 02.07 修改產生回靶料號編碼SEQ取得方式(從RULE及LOV_DATA取值)
- 02.07 修改取得回靶是否包含背板Hard Code寫法(從RULE及LOV_DATA取值)
- 02.07 修改判斷需要產生回靶的方式(設定Flag:Y/N)
- 02.07 修改判斷有無背板的屬性取得方式(從LOV_DATA取值)
- 02.10 修改SourceData Flag:人工建立=>Manual，後端產生=>AutoMap
- 02.10 material-automap.entity新增attrV1欄位屬性
- 02.11 修正進入MATERIAL_REQUEST_CATALOG料號組成類型
- 02.11 拿掉產生回靶料號Catalog判斷SB與T開頭判斷式，直接取Template Rule Catalog Code
- 02.11 修正取得物料類型Hard Code的方式
- 02.11 修改SAP_DATA對應的TypeORM欄位
- 02.12 建立依照不同類型的靶材複製對應的SAP VIEW
- 02.13 建立驗證AutoMap產生VIEW文件的物料類型規則表(Dto)
- 02.13 修改AutoMap產生VIEW文件的判斷式(物料類型必須是包含在對應的VIEW裡)
- 02.14 建立新增物料申請單的Unit Testing
- 02.14 修正取圖號Unit Testing回傳結果格式

## Note

- 未來若負載量過大，把pm2的運行模式調整成Cluster
