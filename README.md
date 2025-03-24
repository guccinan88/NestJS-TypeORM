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
- axios

## material-request-api

### HTTP METHOD

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
- **GET** /generate-semifinished-materials
- **POST** /create-form
- **PATCH** /edit-form
- **DELETE** /delete-form

### Module

- material-request
- sap-rfc

### Service

- auth.service
- material-request.service
- data-source
- sap-rfc
- user.service

### Controller

- material-request

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
- 02.20 AutoMap料號重構成獨立區塊
- 02.21 建立產生中間料號API(@Get('generate-semifinished-materials'))
- 02.21 新增TypeScript的ESLint規則擴展
- 02.21 調整Catalog TypeORM Id欄位
- 02.21 可能為空的參數加入型別斷言
- 02.24 修正中間料號取得MARA料號查詢只查詢到一筆紀錄問題
- 02.24 修改AutoMap一開始命名為回靶相關變數
- 02.25 調整判斷回靶有無背板程式邏輯(加上特徵碼判斷)
- 02.25 修改取得Catalog查詢條件(加入ITEM_SEQ)
- 02.25 修改取得中間料號查詢條件(多加一組GroupBy條件)
- 02.25 修改一些呼叫AutoMap參數
- 02.26 修正取得中間料號Description錯誤
- 02.26 修正取得中間料號Catalog錯誤
- 02.26 修改中間料號AutoMap產生後的物料狀態
- 02.27 修改semifinishedMaterials函數參數
- 02.27 拿掉取得特徵碼Hard Code方式
- 02.27 修改material-template.entity(加入GEN_SEMI_FINISHED欄位對應的屬性)
- 03.03 material-request-form-items.entity加入新欄位(isSemiFinished)
- 03.03 Details新增判斷料號是否要顯示產生中間料號邏輯
- 03.03 Details新增判斷料號是否為中間料號
- 03.03 修改material-template.entity(拿掉GEN_SEMI_FINISHED欄位對應的屬性)
- 03.04 修改AutoMap所產生中間料號的物料說明
- 03.04 修改中間料號自動帶入物料類型
- 03.05 修正取得AutoMap與成品料號對應的特徵碼，資料全上後出現Bug
- 03.05 增加中間料號的目標料號有無背板判斷邏輯
- 03.05 修改判斷有無回靶變數
- 03.06 修正從資料庫取得申請單列表時差問題
- 03.06 修改取得料號建立時間來源(MRFM=>MRFI)
- 03.10 建立自動產生物料說明模組(未完成)
- 03.12 修改TypeORM對應欄位(MaterialLovData、MaterialRule)
- 03.13 新增TypeORM對應欄位(MaterialLovData)
- 03.13 將自動產生物料說明功能獨立區塊
- 03.17 啟動AuthGuard機制
- 03.17 帶入Public Key 解密Token (pubkey.pem)
- 03.17 加入解密程式碼
- 03.18 新增簽核用的Service、Controller
- 03.18 修改產生中間料號單據狀態變為狀態碼"P"程式碼
- 03.20 調整Permission驗證到API路由
- 03.20 修改TypeORM 結構(material-rule.entity.ts)
- 03.21 新增找不到工號出現Type Error卡控程式碼
- 03.21 新增供前端顯示簽核狀態API
- 03.21 新增申請者、部門主管、料號小組所屬表單
- 03.21 新增EMP、DEPT對應的Entity
- 03.24 增加單位主管申請單可視度卡控(清單不顯示草稿與作廢單據)
- 03.24 增加料號小組申請單可視度卡控(清單不顯示草稿與作廢單據)
- 03.24 開發區調整TypeORM版本
- 03.24 增加從Permission API取得結果是undifined的錯誤處理

## Note

- 未來若負載量過大，把pm2的運行模式調整成Cluster
