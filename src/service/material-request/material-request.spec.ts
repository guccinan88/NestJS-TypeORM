import {
  ComponentCode,
  FccDrawingCode,
  MaterialAutomap,
  MaterialLovData,
  MaterialRequestCatalog,
  MaterialRequestFormItems,
  MaterialRequestFormMaster,
  MaterialRequestItemsUom,
  MaterialRequestPlant,
  MaterialRule,
  MaterialTemplate,
  TemDrawingCode,
} from 'src/entities';
import { DataSourceService } from '../database/data-source';
import { MaterialRequestService } from './material-request.service';
import { DataSource, Repository } from 'typeorm';
import { SapService } from './sap-rfc.service';

describe('MaterialRequestService', () => {
  let materialRequestService: MaterialRequestService;
  let mssqlDataSource: DataSourceService;
  let dataSource: DataSource;
  let materialTemplateRepository: Repository<MaterialTemplate>;
  let materialRuleRepository: Repository<MaterialRule>;
  let materialLovData: Repository<MaterialLovData>;
  let materialRequestFormMaster: Repository<MaterialRequestFormMaster>;
  let materialRequestFormItems: Repository<MaterialRequestFormItems>;
  let materialRequestCatalog: Repository<MaterialRequestCatalog>;
  let materialRequestPlant: Repository<MaterialRequestPlant>;
  let materialRequestItemsUom: Repository<MaterialRequestItemsUom>;
  let materialAutomap: Repository<MaterialAutomap>;
  let fccDrawingCode: Repository<FccDrawingCode>;
  let temDrawingCode: Repository<TemDrawingCode>;
  let componentCode: Repository<ComponentCode>;
  let sapService: SapService;

  beforeEach(() => {
    materialRequestService = new MaterialRequestService(
      mssqlDataSource,
      dataSource,
      materialTemplateRepository,
      materialRuleRepository,
      materialLovData,
      materialRequestFormMaster,
      materialRequestFormItems,
      materialRequestCatalog,
      materialRequestPlant,
      materialRequestItemsUom,
      materialAutomap,
      fccDrawingCode,
      temDrawingCode,
      componentCode,
      sapService,
    );
  });

  describe('ComponentCode', () => {
    it('Query Component Codes', async () => {
      const result = [
        {
          id: expect.any(Number),
          componentCode: expect.any(String),
          componentItemNumber: expect.any(String),
          wtRate: expect.any(Number),
          atRate: expect.any(Number),
        },
      ];
      jest
        .spyOn(materialRequestService, 'queryComponentCode')
        .mockImplementation(() => {
          return Promise.resolve(result);
        });
      expect(await materialRequestService.queryComponentCode()).toMatchObject(
        result,
      );
    });
  });
  describe('QueryDrawingCode', () => {
    it('QueryFccDrawingCodes', async () => {
      const result = [
        {
          newDrawingCode: expect.any(String),
          oldDrawingCode: expect.any(String),
        },
      ];
      jest
        .spyOn(materialRequestService, 'queryDrawingCode')
        .mockImplementation(() => {
          return Promise.resolve(result);
        });
      expect(
        await materialRequestService.queryDrawingCode('F', 'C'),
      ).toMatchObject(result);
    });
    it('QueryTemDrawingCodes', async () => {
      const result = [
        {
          newDrawingCode: expect.any(String),
          oldDrawingCode: expect.any(String),
        },
      ];
      jest
        .spyOn(materialRequestService, 'queryDrawingCode')
        .mockImplementation(() => {
          return Promise.resolve(result);
        });
      expect(
        await materialRequestService.queryDrawingCode('T', ''),
      ).toMatchObject(result);
    });
  });
  describe('CreateMaterialRequest', () => {
    it('新增物料申請單', async () => {
      const data = {
        codes: [
          {
            materialNo: 'TOA1CU999HALOSO173G140BX4C9SZZZ001G3',
            validation: true,
            primaryPlant: '1100',
            secondPlant: ['1200', '1300'],
            transferPlant: true,
            templateCode: 'T01',
            materialDescription: 'TTT',
            reason: 'DSD',
            baseUom: 'BDL',
            weightUom: 'G',
            lovGroups: [
              {
                catalogCode: 'T011',
                lovGroup: 'GROUP_T',
                lovCode: 'T',
                lovDescription: '靶材',
                inputMethod: 'LOV',
                catalogSeq: 1,
              },
              {
                catalogCode: 'T012',
                lovGroup: 'PRODUCT1_T',
                lovCode: 'O',
                lovDescription: '環形',
                inputMethod: 'LOV',
                catalogSeq: 2,
              },
              {
                catalogCode: 'T013',
                lovGroup: 'PRODUCT2_T',
                lovCode: 'A',
                lovDescription: 'C10100',
                inputMethod: 'LOV',
                catalogSeq: 3,
              },
              {
                catalogCode: 'T014',
                lovGroup: 'IDENTITY_CODE',
                lovCode: '1',
                lovDescription: '自有(有價)',
                inputMethod: 'LOV',
                catalogSeq: 4,
              },
              {
                catalogCode: 'T015',
                lovGroup: 'BOM_CODE',
                lovCode: 'CU999',
                lovDescription: 'CU999',
                inputMethod: 'LOV',
                catalogSeq: 5,
              },
              {
                catalogCode: 'T016',
                lovGroup: 'SPECIAL_CODE1_T',
                lovCode: 'HA',
                lovDescription: 'HP',
                inputMethod: 'LOV',
                catalogSeq: 6,
              },
              {
                catalogCode: 'T017',
                lovGroup: 'SPECIAL_CODE2_T',
                lovCode: 'LO',
                lovDescription: '低氧版',
                inputMethod: 'LOV',
                catalogSeq: 7,
              },
              {
                catalogCode: 'T018',
                lovGroup: 'DRAWING',
                lovCode: 'SO173G140BX4C9SZZZ001',
                lovDescription: 'SO173G140BX4C9SZZZ001',
                inputMethod: 'DRAWING',
                catalogSeq: 8,
              },
              {
                catalogCode: 'T019',
                lovGroup: 'OP_CODE_T',
                lovCode: 'G3',
                lovDescription: '取樣棒後',
                inputMethod: 'LOV',
                catalogSeq: 9,
              },
              {
                catalogCode: 'T01_100',
                lovGroup: 'MATERIAL_TYPE',
                lovCode: 'Z004',
                lovDescription: '原物料',
                inputMethod: 'LOV',
                catalogSeq: 100,
              },
              {
                catalogCode: 'T01_101',
                lovGroup: 'RETURN_TARGET_TYPE',
                lovCode: 'CUSTOMER_TARGET',
                lovDescription: 'CUSTOMER_TARGET回靶',
                inputMethod: 'LOV',
                catalogSeq: 101,
              },
            ],
            sapData: {
              mrpType: 'ND',
              procType: 'E',
              depReqId: '2',
              productUom: 'BAL',
              lotsizekey: 'WB',
              prodprof: '13dsdsd',
              workSchedView: true,
              mrpController: [
                {
                  plant: '1100',
                  controller: 'TP1',
                  type: 'primary',
                },
                {
                  plant: '1200',
                  controller: 'PM1',
                  type: 'second',
                },
                {
                  plant: '1300',
                  controller: 'SM1',
                  type: 'second',
                },
              ],
              salesUom: 'BT',
              delygPlnt: '1100',
              indPostToInspStock: true,
              sourcelist: true,
              purUom: 'BAL',
              purGroup: '1S1',
              purchaseOrderContent: 'DSCCCC',
              characteristic: true,
              alternativeUom: 'BT',
              alternativeUomQty: 112,
              basicUnitQty: 555,
            },
          },
        ],
      };
      const dataResultSchema = {
        success: expect.any(Boolean),
        message: expect.any(String),
        data: expect.any(Object),
      };
      jest
        .spyOn(materialRequestService, 'createMaterialRequestForm')
        .mockImplementation(() => {
          return Promise.resolve({
            success: true,
            message: '建立成功',
            data: {
              formNo: '',
              masterId: '',
            },
          });
        });
      expect(
        await materialRequestService.createMaterialRequestForm(data),
      ).toMatchObject(dataResultSchema);
    });
  });
});
