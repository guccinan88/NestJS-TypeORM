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
          id: 1,
          componentCode: 'CU1657',
          componentItemNumber: 'Cu',
          wtRate: 1,
          atRate: 1,
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
          newDrawingCode: 'FACX198XX6EZ01',
          oldDrawingCode: '0198E-0',
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
          newDrawingCode: 'SRX19AX11DXXX5NZZW001',
          oldDrawingCode: '0019C-2',
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
});
