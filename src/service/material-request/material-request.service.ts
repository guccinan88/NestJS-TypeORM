import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/filters/http-exception/http-exception.filter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { camelCase, mapKeys, snakeCase } from 'lodash';
import {
  FccDrawingCode,
  TemDrawingCode,
  MaterialLovData,
  MaterialRule,
  MaterialTemplate,
  ComponentCode,
  MaterialRequestFormMaster,
  MaterialRequestFormItems,
  MaterialRequestCatalog,
  MaterialRequestPlant,
  MaterialRequestItemsUom,
  MaterialAutomap,
  EmpAll,
  MaterialApprovedLog,
} from 'src/entities';
import { Like, Repository, DataSource, In } from 'typeorm';
import { DataSourceService } from '../database/data-source';
// import { SapService } from './sap-rfc.service';
import {
  MRPViewMaterialType,
  SDViewMaterialType,
  PurchaseType,
} from 'src/dto/create-sap-view-validation.dto';
import { UserService } from '../auth/user.service';
import { ApproveService } from '../approve/approve.service';
@Injectable()
export class MaterialRequestService {
  constructor(
    private readonly mssqlDataSource: DataSourceService,
    @InjectDataSource('msConnection') private readonly dataSource: DataSource,
    @InjectRepository(MaterialTemplate, 'msConnection')
    private readonly materialTemplateRepository: Repository<MaterialTemplate>,
    @InjectRepository(MaterialRule, 'msConnection')
    private readonly materialRuleRepository: Repository<MaterialRule>,
    @InjectRepository(MaterialLovData, 'msConnection')
    private readonly materialLovData: Repository<MaterialLovData>,
    @InjectRepository(MaterialRequestFormMaster, 'msConnection')
    private readonly materialRequestFormMaster: Repository<MaterialRequestFormMaster>,
    @InjectRepository(MaterialRequestFormItems, 'msConnection')
    private readonly materialRequestFormItems: Repository<MaterialRequestFormItems>,
    @InjectRepository(MaterialRequestCatalog, 'msConnection')
    private readonly materialRequestCatalog: Repository<MaterialRequestCatalog>,
    @InjectRepository(MaterialRequestPlant, 'msConnection')
    private readonly materialRequestPlant: Repository<MaterialRequestPlant>,
    @InjectRepository(MaterialRequestItemsUom, 'msConnection')
    private readonly materialRequestItemsUom: Repository<MaterialRequestItemsUom>,
    @InjectRepository(MaterialAutomap, 'msConnection')
    private readonly materialAutomap: Repository<MaterialAutomap>,
    @InjectRepository(FccDrawingCode, 'pgConnection')
    private readonly fccDrawingCode: Repository<FccDrawingCode>,
    @InjectRepository(TemDrawingCode, 'pgConnection')
    private readonly temDrawingCode: Repository<TemDrawingCode>,
    @InjectRepository(ComponentCode, 'pgConnection')
    private readonly componentCode: Repository<ComponentCode>,
    // private readonly sapService: SapService,
    private readonly userService: UserService,
    private readonly approvedLogService: ApproveService,
  ) {}

  async queryTemplateCodeAll(): Promise<any> {
    try {
      const queryTemplateCodeResult =
        await this.materialTemplateRepository.find({
          select: ['templateCode', 'templateName', 'enableFlag'],
        });
      return queryTemplateCodeResult;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('查詢TemplateCode發生錯誤', false);
    }
  }

  async queryTemplateItems(templateCode: string): Promise<any> {
    try {
      const queryTemplateRuleResult = await this.materialRuleRepository.find({
        where: {
          templateCode: templateCode,
        },
        select: [
          'catalogCode',
          'catalogName',
          'catalogSeq',
          'lovGroup',
          'parentLovGroup',
          'inputMethod',
          'enableFlag',
          'mustFlag',
          'combinationFlag',
          'descriptionSeq',
        ],
      });

      const itemsResult = [].concat(
        ...(await Promise.all(
          queryTemplateRuleResult.map(async (item) => {
            const queryTemplateLovDataResult = await this.materialLovData.find({
              where: {
                lovGroup: item.lovGroup,
              },
              select: [
                'lovGroup',
                'lovCode',
                'lovDescription',
                'parentLovValue',
                'descriptionCombination',
                'enableFlag',
              ],
            });
            return queryTemplateLovDataResult;
          }),
        )),
      );

      return {
        rules: queryTemplateRuleResult,
        items: itemsResult,
      };
    } catch (error) {
      console.error(`查詢TemplateItems發生錯誤: ${error}`);
    }
  }
  //查詢圖號，TEM與FCC有各自Table，藉由groupCode判斷屬於哪一個BU
  async queryDrawingCode(
    groupCode: string,
    productBigCode: string,
  ): Promise<object[]> {
    if (groupCode === 'F') {
      const queryFccDrawingCodeResult = await this.fccDrawingCode.find({
        where: {
          newDrawingCode: Like(`__${productBigCode || ''}%`),
        },
        select: ['newDrawingCode', 'oldDrawingCode'],
      });
      return queryFccDrawingCodeResult;
    } else {
      const queryTemDrawingCodeResult = await this.temDrawingCode.find({
        where: { newDrawingCode: Like(`_${productBigCode || ''}%`) },
        select: ['newDrawingCode', 'oldDrawingCode'],
      });
      return queryTemDrawingCodeResult;
    }
  }
  async queryComponentCode(): Promise<ComponentCode[]> {
    return await this.componentCode.find({
      select: ['componentCode', 'componentItemNumber', 'wtRate', 'atRate'],
    });
  }
  async createMaterialRequestForm(createFormDto, { jwtCookie }) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const userInfo = await this.userService.getJwtVerify({ jwtCookie });
      const { masterId } = createFormDto;
      const {
        codes: [{ semiMaterial }],
      } = createFormDto;
      const materialMasterToInsert: MaterialRequestFormMaster[] = [];
      const materialItemsToInsert: MaterialRequestFormItems[] = [];
      const materialCatalogToInsert: MaterialRequestCatalog[] = [];
      const materialPlantToInsert: MaterialRequestPlant[] = [];
      const materialUomToInsert: MaterialRequestItemsUom[] = [];
      const queryMaterialRequestCurrentSequenceResult =
        await this.mssqlDataSource.queryMaterialRequestCurrentSequence();
      const createFormMasterId = masterId
        ? masterId
        : queryMaterialRequestCurrentSequenceResult[0].CurrentValue;
      const userId = (userInfo as any).workerNumber;
      const userName = (userInfo as any).name;
      if (!masterId) {
        materialMasterToInsert.push({
          masterId: createFormMasterId,
          userId: userId,
          statusCode: 'N',
          createdBy: userName,
        });
      }
      for (const {
        materialNo,
        lovGroups,
        primaryPlant,
        secondPlant, //次工廠用來拓展工廠VIEW
        transferPlant,
        templateCode,
        materialDescription,
        remarks,
        reason,
        baseUom,
        weightUom,
        validation,
        sapData,
      } of createFormDto.codes) {
        const queryMaterialIdSequenceResult =
          await this.mssqlDataSource.queryMaterialIdCurrentSequence();
        const materialIdSequence =
          queryMaterialIdSequenceResult[0].CurrentValue;
        const plants = [...secondPlant, primaryPlant];
        //MaterialType的資料在下一層，所以透過find函數先fetch出來
        const materialType = lovGroups.find(
          (item) => item.lovGroup === 'MATERIAL_TYPE',
        )?.lovCode;
        materialItemsToInsert.push({
          materialId: materialIdSequence,
          masterId: createFormMasterId,
          materialNo: materialNo,
          templateCode: templateCode,
          materialType: materialType,
          primaryPlant: primaryPlant,
          materialDescription: materialDescription,
          reason: reason,
          remarks: remarks,
          weightUom: weightUom,
          baseUom: baseUom,
          validation: validation,
          transferPlant: transferPlant,
          sourceData: 'Manual',
        });

        for (const {
          catalogCode,
          lovGroup,
          lovCode,
          catalogSeq,
          lovDescription,
          inputMethod,
        } of lovGroups) {
          materialCatalogToInsert.push({
            materialId: materialIdSequence,
            masterId: createFormMasterId,
            catalogGroup: lovGroup,
            catalogCode: catalogCode,
            catalogSeq: catalogSeq,
            catalogValue: lovCode,
            inputMethod: inputMethod,
            catalogDescription: lovDescription,
          });
        }

        for (const plant of plants) {
          const mrpController = await sapData?.mrpController?.find(
            (item) => plant === item.plant,
          )?.controller;
          const {
            procType,
            purUom,
            purGroup,
            productUom,
            salesUom,
            mrpType,
            depReqId,
            workSchedView,
            prodprof,
            lotsizekey,
            indPostToInspStock,
            sourcelist,
            purchaseOrderContent,
            delygPlnt,
          } = sapData;
          // 切採購類型/特殊採購類型
          const splitSpprocType = (procType || '').split('/');
          materialPlantToInsert.push({
            materialId: materialIdSequence,
            plant: plant,
            procType:
              procType && splitSpprocType.length > 0
                ? plant !== primaryPlant
                  ? 'F'
                  : splitSpprocType[0]
                : '',
            spprocType:
              procType && splitSpprocType.length > 0
                ? plant !== primaryPlant
                  ? primaryPlant.substring(0, 2)
                  : splitSpprocType[1]
                : '',
            purUom: purUom,
            purGroup: purGroup,
            productUom: productUom,
            salesUom: salesUom,
            mrpController: mrpController,
            mrpType: mrpType,
            depReqId: depReqId,
            workSchedView: workSchedView,
            prodprof: prodprof,
            lotsizekey: lotsizekey,
            indPostToInspStock: indPostToInspStock,
            sourcelist: sourcelist,
            purchaseOrderContent: purchaseOrderContent,
            delygPlnt: delygPlnt,
          });
        }
        const {
          characteristic,
          basicUnitQty,
          alternativeUomQty,
          alternativeUom,
        } = sapData;
        const characteristicName =
          characteristic &&
          (await this.queryCharacteristicName(baseUom, alternativeUom));

        materialUomToInsert.push({
          materialId: materialIdSequence,
          characteristicName: characteristicName || '',
          basicUnitQty: basicUnitQty,
          alternativeUom: alternativeUom,
          alternativeUomQty: alternativeUomQty,
          characteristic: characteristic,
        });
        //取UI選取的回靶類型
        const returnTargetType = createFormDto.codes[0].lovGroups.find(
          (item) => item.lovGroup === 'RETURN_TARGET_TYPE',
        )?.lovCode;
        //取ReturnTarget對應的LovData
        const queryReturnTargetLovData = await this.materialLovData.find({
          where: {
            lovCode: returnTargetType,
          },
        });
        //產生回靶料號，等於Y代表有回靶
        if (queryReturnTargetLovData[0]?.attrV1 === 'Y' && validation) {
          try {
            await this.generateAutomapMaterials({
              returnTargetType,
              queryReturnTargetLovData,
              templateCode,
              materialCatalogToInsert,
              materialItemsToInsert,
              materialPlantToInsert,
              createFormMasterId,
              primaryPlant,
              reason: '回靶料號',
              remarks: 'AutoMap產生料號',
              weightUom,
              baseUom,
              transferPlant,
              validation,
              sapData,
            });
          } catch (error) {
            throw new CustomHttpException('AutoMap料號產生失敗', false);
          }
        }
        //INSERT DATA TO DB
        await queryRunner.startTransaction();
        if (!masterId) {
          await queryRunner.manager.insert(
            MaterialRequestFormMaster,
            materialMasterToInsert,
          );
        }
        await queryRunner.manager.insert(
          MaterialRequestFormItems,
          materialItemsToInsert,
        );
        await queryRunner.manager.insert(
          MaterialRequestCatalog,
          materialCatalogToInsert,
        );
        await queryRunner.manager.insert(
          MaterialRequestPlant,
          materialPlantToInsert,
        );
        await queryRunner.manager.insert(
          MaterialRequestItemsUom,
          materialUomToInsert,
        );
        await this.approvedLogService.createMaterialApprovedLog({
          masterId: createFormMasterId,
          stageType: 'APPLICANT',
          approver: userId,
          rank: 0,
          status: 'WAIT_APPROVAL',
          reason: '草稿起單',
          approveTemplate: semiMaterial ? 'APPROVE_FLOW2' : 'APPROVE_FLOW1',
        });
        await queryRunner.commitTransaction();
        const returnMasterFormNo = await this.materialRequestFormMaster.findOne(
          {
            where: { masterId: createFormMasterId },
            select: ['formNo'],
          },
        );
        return {
          success: true,
          message: '建立成功',
          data: {
            formNo: returnMasterFormNo.formNo,
            masterId: createFormMasterId,
          },
        };
      }
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw new CustomHttpException('建立失敗', false);
    }
  }

  async semifinishedMaterials({ materialId, empName, empNo }) {
    const queryRunner = this.dataSource.createQueryRunner();
    const materialItemsToInsert: MaterialRequestFormItems[] = [];
    const materialCatalogToInsert: MaterialRequestCatalog[] = [];
    const queryMaterialItem = await this.materialRequestFormItems.findOne({
      where: {
        materialId: materialId,
      },
    });

    const {
      templateCode,
      masterId,
      weightUom,
      baseUom,
      primaryPlant,
      transferPlant,
    } = queryMaterialItem;

    //取得產生中間料號的目標成品料號
    const queryCreatedMaterialCatalogs = await this.materialRequestCatalog
      .createQueryBuilder('mrc')
      .where('mrc.MATERIAL_ID = :materialId', { materialId })
      .orderBy('mrc.CATALOG_SEQ', 'ASC')
      .getRawMany();
    //取得特徵碼1
    const specialCodeValue = queryCreatedMaterialCatalogs.find((item) =>
      item.mrc_CATALOG_GROUP.startsWith('SPECIAL_CODE1'),
    )?.mrc_CATALOG_VALUE;
    //產生中間料號目標料號有無背板
    const materialBakcPlane = queryCreatedMaterialCatalogs.find((item) =>
      item.mrc_CATALOG_GROUP.startsWith('PRODUCT2'),
    )?.mrc_CATALOG_VALUE;
    // const { masterId, weightUom, baseUom, primaryPlant, transferPlant } =
    //   queryMaterialItem;
    try {
      await this.generateAutomapMaterials({
        queryCreatedMaterialCatalogs,
        materialCatalogToInsert,
        materialItemsToInsert,
        specialCodeValue:
          materialBakcPlane === 'R'
            ? `${specialCodeValue}_R`
            : specialCodeValue,
        templateCode,
        primaryPlant,
        createFormMasterId: masterId,
        reason: '中間料號',
        remarks: 'AutoMap產生料號',
        weightUom,
        baseUom,
        transferPlant,
        isSemiFinished: true,
        materialId,
      });
      await queryRunner.startTransaction();
      await queryRunner.manager.insert(
        MaterialRequestFormItems,
        materialItemsToInsert,
      );
      await queryRunner.manager.insert(
        MaterialRequestCatalog,
        materialCatalogToInsert,
      );
      // await this.approvedLogService.updateMaterialApprovedLog({
      //   masterId,
      //   rank: 20,
      //   reason: '中間料號編輯完成',
      //   status: 'APPROVED',
      // });
      await queryRunner.commitTransaction();
    } catch (error) {
      throw new CustomHttpException('AutoMap料號產生失敗', false);
    }
  }
  //產生AutoMap料號:回靶、中間料號
  async generateAutomapMaterials({
    returnTargetType = '',
    specialCodeValue = '',
    queryCreatedMaterialCatalogs = [],
    queryReturnTargetLovData = [],
    templateCode,
    materialItemsToInsert,
    materialCatalogToInsert,
    materialPlantToInsert = [],
    createFormMasterId,
    primaryPlant,
    reason,
    remarks,
    weightUom,
    baseUom,
    transferPlant,
    validation = false,
    isSemiFinished = false,
    sapData = {},
    materialId = '',
  }) {
    //取得判斷有無背板Flag
    const queryAutoMapCatalog = await this.materialAutomap.find({
      where: {
        templateCode: templateCode,
        attrV1: 'BACK_PLANE',
      },
    });
    const getAutoMapGroupCode = await queryAutoMapCatalog.map(
      (item) => item.formFild,
    );
    const queryBackPlaneRuleGroupCode = await this.materialRuleRepository.find({
      select: ['lovGroup'],
      where: {
        templateCode: templateCode,
        catalogCode: getAutoMapGroupCode[0],
      },
    });
    //取得產生回靶Template
    const [{ lovGroup }] = queryBackPlaneRuleGroupCode;
    const autoMapBackplane = materialCatalogToInsert.find(
      (entry) => entry.catalogGroup === lovGroup,
    )?.catalogValue;
    //如果收到的參數值是回靶，就接著判斷是否有背板，如果參數值不是回靶就拿特徵碼
    const queryTypeKindTemplate = returnTargetType
      ? autoMapBackplane === 'R' && returnTargetType === 'CUSTOMER_TARGET'
        ? `${returnTargetType}_R`
        : returnTargetType
      : specialCodeValue;
    const groupByAutoMapType = await this.materialAutomap
      .createQueryBuilder('ma')
      .select('ma.typeKind')
      .addSelect('ma.templateCode')
      .addSelect('ma.itemSeq')
      .addSelect('COUNT(ma.automapId)', 'targetTypeCount')
      .where('ma.typeKind=:autoMapType', {
        autoMapType: queryTypeKindTemplate,
      })
      .groupBy('ma.typeKind')
      .addGroupBy('ma.templateCode')
      .addGroupBy('ma.itemSeq')
      .getRawMany();
    for (const maCode of groupByAutoMapType) {
      const autoMapMaterialIdSequenceResult =
        await this.mssqlDataSource.queryMaterialIdCurrentSequence();
      const autoMapMaterialIdSequence =
        autoMapMaterialIdSequenceResult[0].CurrentValue;
      //取Automap規則
      const queryAutoMapCodes = await this.materialAutomap.find({
        where: {
          typeKind: queryTypeKindTemplate,
          templateCode: maCode.ma_TEMPLATE_CODE,
          itemSeq: maCode.ma_ITEM_SEQ,
        },
      });
      //取Template需加入編碼的RULE
      const queryTemplateRule = await this.materialRuleRepository.find({
        where: {
          templateCode: maCode.ma_TEMPLATE_CODE,
          combinationFlag: true,
        },
      });
      //取Template編碼的SEQ
      const queryTemplateSeq = await this.materialRuleRepository.find({
        where: {
          templateCode: maCode.ma_TEMPLATE_CODE,
        },
      });
      //取物料類型
      const queryTemplateMaterialType = await this.materialRuleRepository.find({
        where: {
          templateCode: maCode.ma_TEMPLATE_CODE,
          lovGroup: 'MATERIAL_TYPE',
        },
      });
      const [{ catalogCode }] = queryTemplateMaterialType;
      const autoMapMaterialType = queryAutoMapCodes.find(
        (item) => item.formFild === catalogCode,
      )?.refDefaultValue;
      //取AUTOMAP裡是CATALOG的欄位值
      const getRefFieldCatalog = queryAutoMapCodes
        .filter(
          (item) =>
            item.refField !== '' &&
            item.refSource === 'CATALOG' &&
            queryTemplateRule.some(
              (subItem) => subItem.catalogCode === item.formFild,
            ),
        )
        .map((item) => ({
          itemSeq: queryTemplateRule.find(
            (subItem) => subItem.catalogCode === item.formFild,
          )?.catalogSeq,
          refField: item.refField,
        }));
      //取AUTOMAP裡是DEFAULT的欄位值
      const getRefFieldDefault = queryAutoMapCodes
        .filter(
          (item) =>
            item.refSource === 'DEFAULT' &&
            queryTemplateRule.some(
              (subItem) => subItem.catalogCode === item.formFild,
            ),
        )
        .map((item) => ({
          itemSeq: queryTemplateRule.find(
            (subItem) => subItem.catalogCode === item.formFild,
          )?.catalogSeq,
          refField: item.refDefaultValue,
        }));

      //根據TYPE_KIND設定與觸發條件走不同的AutoMap產生料號邏輯
      const autoMapMaterialDatas = getRefFieldCatalog.map((item) => {
        const match = returnTargetType
          ? //回靶
            materialCatalogToInsert.find(
              (entry) => entry.catalogCode === item.refField,
            )
          : //中間料號
            queryCreatedMaterialCatalogs.find(
              (entry) => entry.mrc_CATALOG_CODE === item.refField,
            );
        return match
          ? [
              {
                ...item,
                refField: returnTargetType
                  ? //回靶的話取catalogValue，中間料號取mrc_CATALOG_VALUE
                    match.catalogValue
                  : match.mrc_CATALOG_VALUE,
              },
              ...getRefFieldDefault,
            ]
          : item;
      });
      const autoMapSeqResult = autoMapMaterialDatas
        .flat()
        //參數:當前元素,當前元素索引,原始陣列
        .filter(
          (value, index, self) =>
            index === self.findIndex((r) => r.itemSeq === value.itemSeq),
        )
        .sort((a, b) => a.itemSeq - b.itemSeq)
        .map((item) => item.refField)
        .join('');
      //自動產生AutoMap物料說明
      const autoMaplovCodes = await Promise.all(
        queryAutoMapCodes.map(async (catalogCodes) => {
          const queryLovCodesResult =
            catalogCodes.refDefaultValue ||
            (returnTargetType
              ? materialCatalogToInsert.find(
                  (item) => item.catalogCode === catalogCodes.refField,
                )?.catalogValue
              : queryCreatedMaterialCatalogs.find(
                  (item) => item.mrc_CATALOG_CODE === catalogCodes.refField,
                )?.mrc_CATALOG_VALUE);
          const querycatalogGroups = await this.materialRuleRepository.find({
            where: {
              catalogCode: catalogCodes.formFild,
            },
          });
          const lovGroup = querycatalogGroups
            .flat()
            .find(
              (item) => item.catalogCode === catalogCodes.formFild,
            )?.lovGroup;
          return {
            lovGroup,
            lovCode: queryLovCodesResult,
          };
        }),
      );
      const materialDescription = await this.autoGenerateMaterialDescription({
        templateCode: maCode.ma_TEMPLATE_CODE,
        catalogCode: autoMaplovCodes,
      });
      materialItemsToInsert.push({
        materialId: autoMapMaterialIdSequence,
        masterId: createFormMasterId,
        materialNo: autoMapSeqResult,
        templateCode: maCode.ma_TEMPLATE_CODE,
        materialType: autoMapMaterialType,
        primaryPlant: primaryPlant,
        materialDescription:
          materialDescription || 'No Auto Generate Description',
        reason: reason,
        remarks: remarks,
        weightUom: weightUom,
        baseUom: baseUom,
        validation: validation,
        transferPlant: transferPlant,
        sourceData: returnTargetType ? 'ReturnTargetCode' : 'SemiCode',
        isSemiFinished: isSemiFinished,
      });
      //產生AutoMap Catalog
      for (const catalogCodes of queryAutoMapCodes) {
        //Template Rule的類型是Catalog才做物料編碼
        if (catalogCodes.formSource === 'CATALOG') {
          const queryMaterialRule = await this.materialRuleRepository.find({
            where: {
              catalogCode: catalogCodes.formFild,
            },
          });
          const lovGroup = queryMaterialRule
            .flat()
            .find(
              (item) => item.catalogCode === catalogCodes.formFild,
            )?.lovGroup;
          const inputMethod = queryMaterialRule
            .flat()
            .find(
              (item) => item.catalogCode === catalogCodes.formFild,
            )?.inputMethod;
          const queryMaterialLovData = await this.materialLovData.find({
            where: {
              lovGroup: lovGroup,
              lovCode: catalogCodes.refDefaultValue,
            },
          });
          const lovDescription = queryMaterialLovData
            .flat()
            .find((item) => item.lovGroup === lovGroup)?.lovDescription;
          materialCatalogToInsert.push({
            materialId: autoMapMaterialIdSequence,
            masterId: createFormMasterId,
            catalogGroup: lovGroup,
            catalogCode: catalogCodes.formFild,
            catalogSeq: queryTemplateSeq.find(
              (item) => item.catalogCode === catalogCodes.formFild,
            )?.catalogSeq,
            catalogValue:
              catalogCodes.refDefaultValue ||
              (returnTargetType
                ? materialCatalogToInsert.find(
                    (item) => item.catalogCode === catalogCodes.refField,
                  )?.catalogValue
                : queryCreatedMaterialCatalogs.find(
                    (item) => item.mrc_CATALOG_CODE === catalogCodes.refField,
                  )?.mrc_CATALOG_VALUE),
            inputMethod: inputMethod,
            catalogDescription:
              lovDescription ||
              materialCatalogToInsert.find(
                (item) => item.catalogCode === catalogCodes.refField,
              )?.catalogDescription ||
              queryCreatedMaterialCatalogs.find(
                (item) => item.mrc_CATALOG_CODE === catalogCodes.refField,
              )?.mrc_CATALOG_DESCRIPTION,
          });
        }
      }
      //建立回靶料號SAP文件(回靶才進入這段)
      if (returnTargetType) {
        try {
          const sapViewType = queryAutoMapCodes.find(
            (item) => item.formSource === 'SAP_DATA',
          )?.refSource;
          //判斷要建立哪一類型的VIEW，取出對應的物料類型
          const validSapViewMaterialTypes =
            sapViewType === 'SD'
              ? Object.values(SDViewMaterialType).filter(
                  (value) => typeof value === 'string',
                )
              : Object.values(MRPViewMaterialType).filter(
                  (value) => typeof value === 'string',
                );
          //客供回靶SD，判斷物料類型是否包含在SD VIEW
          if (
            sapViewType === 'SD' &&
            validSapViewMaterialTypes.includes(autoMapMaterialType)
          ) {
            const { salesUom, delygPlnt } = sapData as {
              salesUom: string;
              delygPlnt: string;
            };
            materialPlantToInsert.push({
              materialId: autoMapMaterialIdSequence,
              plant: primaryPlant,
              salesUom: salesUom,
              delygPlnt: delygPlnt,
            });
          }
          //租賃回靶MRP，判斷物料類型是否包含在MRP VIEW
          else if (
            sapViewType === 'MRP' &&
            validSapViewMaterialTypes.includes(autoMapMaterialType)
          ) {
            const {
              procType,
              purUom,
              purGroup,
              productUom,
              mrpType,
              depReqId,
              workSchedView,
              prodprof,
              lotsizekey,
              indPostToInspStock,
              sourcelist,
              purchaseOrderContent,
            } = sapData as {
              procType: string;
              purUom: string;
              purGroup: string;
              productUom: string;
              mrpType: string;
              depReqId: string;
              workSchedView: string;
              prodprof: string;
              lotsizekey: string;
              indPostToInspStock: boolean;
              sourcelist: string[];
              purchaseOrderContent: string[];
            };
            //mrpController屬性可能存在或可能不存在，如果存在類型會是Array並且有plant與controller兩個屬性
            const mrpController = await (
              sapData as {
                mrpController?: { plant: string; controller: string }[];
              }
            )?.mrpController?.find((item) => primaryPlant === item.plant)
              ?.controller;
            materialPlantToInsert.push({
              materialId: autoMapMaterialIdSequence,
              plant: primaryPlant,
              procType: procType,
              purUom: purUom,
              purGroup: purGroup,
              productUom: productUom,
              mrpController: mrpController,
              mrpType: mrpType,
              depReqId: depReqId,
              workSchedView: workSchedView,
              prodprof: prodprof,
              lotsizekey: lotsizekey,
              indPostToInspStock: indPostToInspStock,
              sourcelist: sourcelist,
              purchaseOrderContent: purchaseOrderContent,
            });
            //物料類型與SAP VIEW無法匹配時候觸發
          } else {
            throw new Error();
          }
        } catch (error) {
          console.error(error);
          return {
            success: false,
            message: 'AutoMap產生VIEW物料類型錯誤',
          };
        }
      }
    }
  }

  async queryMaterialList(
    queryConditions: Partial<Record<string, string>>,
    empNo: string,
    isDepartmentBoss: boolean,
    isMaterialTeamMamber: boolean,
    queryDeptEmpList: EmpAll[],
  ) {
    try {
      const formNo = queryConditions.formNo;
      const materialNo = queryConditions.materialNo;
      const bomCode = queryConditions.bomCode;
      const drawing = queryConditions.drawing;
      const specialCode = queryConditions.specialCode;
      const statusCode = queryConditions.statusCode || []; //|| 'C';
      const page = Number(queryConditions.page) || 1; //頁數
      const pageSize = Number(queryConditions.pageSize) || 10; //每頁筆數

      // const conditionStatusCode =
      //   statusCode !== 'C'
      //     ? 'mrfm.STATUS_CODE = :statusCode'
      //     : 'mrfm.STATUS_CODE <> :statusCode';
      const queryFormMaster = this.dataSource
        .getRepository(MaterialRequestFormMaster)
        .createQueryBuilder('mrfm')
        .select([
          'mrfi.MATERIAL_ID',
          'mrfm.FORM_NO',
          'mrfm.USER_ID',
          'mrfi.CREATED_DATE',
          'STATUS_CODE',
          'mrfi.BASE_UOM',
          'mld.LOV_DESCRIPTION AS baseUomDescription',
          'mrfi.WEIGHT_UOM',
          `IIF(mrfi.VALIDATION='Y',CAST(1 AS BIT), CAST(0 AS BIT)) AS VALIDATION`,
          'mrfi.MATERIAL_NO',
          'mrfi.MATERIAL_DESCRIPTION',
          'mrfi.REASON',
          'mrfi.REMARKS',
          'mt.TEMPLATE_NAME',
          'mt.TEMPLATE_CODE',
        ])
        .innerJoin(
          MaterialRequestFormItems,
          'mrfi',
          "mrfm.MASTER_ID = mrfi.MASTER_ID AND ISNULL(mrfi.IS_DELETED, 'N') <> 'Y'",
        )
        .innerJoin(
          MaterialTemplate,
          'mt',
          'mrfi.TEMPLATE_CODE = mt.TEMPLATE_CODE',
        )
        .leftJoin(
          MaterialLovData,
          'mld',
          "mld.LOV_CODE=mrfi.BASE_UOM AND mld.LOV_GROUP='SAP_UOM'",
        )
        .where('mrfm.USER_ID=:empNo', { empNo });

      //先判斷是否為料號小組，如果不是就在判斷是否為部門主管，若都不是就是一般使用者
      // isMaterialTeamMamber
      //   ? queryFormMaster.where(`mrfm.STATUS_CODE NOT IN('N','O')`) //過濾掉草稿與作廢單據
      //   : isDepartmentBoss
      //     ? queryFormMaster.where(
      //         `mrfm.USER_ID IN(:...queryDeptEmpList) AND mrfm.STATUS_CODE NOT IN('N','O')`, //過濾掉草稿與作廢單據
      //         {
      //           queryDeptEmpList: queryDeptEmpList.map((item) => item.empNo),
      //         },
      //       )
      //     : queryFormMaster.where('mrfm.USER_ID=:empNo', { empNo });

      // .andWhere(
      //   statusCode && statusCode.length > 0
      //     ? 'mrfm.STATUS_CODE IN(:...statusCode)'
      //     : '1=1', // 如果 statusCode 為空，改為 IS NULL
      //   { statusCode: statusCode || null },
      // );
      statusCode.length > 0 &&
        queryFormMaster.andWhere('mrfm.STATUS_CODE IN(:...statusCode)', {
          statusCode,
        });
      //動態查詢條件原本if方式，修改成物件+loop查詢方式
      const parametersQueryConditions = [
        {
          condition: formNo,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestFormMaster, 'mrfms')
              .where('mrfms.FORM_NO = :formNo', { formNo })
              .andWhere('mrfms.MASTER_ID = mrfm.MASTER_ID'),
        },
        {
          condition: materialNo,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestFormItems, 'mrfis')
              .where('mrfis.MATERIAL_NO = :materialNo', { materialNo })
              .andWhere('mrfis.MATERIAL_ID = mrfi.MATERIAL_ID'),
        },
        {
          condition: bomCode,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestCatalog, 'cata')
              .where('cata.MATERIAL_ID = mrfi.MATERIAL_ID')
              .andWhere(`cata.CATALOG_GROUP='BOM_CODE'`)
              .andWhere('cata.CATALOG_VALUE=:bomCode', { bomCode }),
        },
        {
          condition: drawing,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestCatalog, 'cata')
              .where('cata.MATERIAL_ID = mrfi.MATERIAL_ID')
              .andWhere(`cata.CATALOG_GROUP='DRAWING'`)
              .andWhere('cata.CATALOG_VALUE=:drawing', { drawing }),
        },
        {
          condition: specialCode,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestCatalog, 'cata')
              .where('cata.MATERIAL_ID=mrfi.MATERIAL_ID')
              .andWhere(`cata.CATALOG_GROUP LIKE 'SPECIAL_CODE%'`)
              .andWhere('cata.CATALOG_VALUE=:specialCode', { specialCode }),
        },
      ];

      parametersQueryConditions.forEach(({ condition, subQuery }) => {
        if (condition) {
          queryFormMaster.andWhere((qb) => {
            const query = subQuery(qb).getQuery();
            return `EXISTS (${query})`;
          });
        }
      });
      const countQuery = this.dataSource
        .createQueryBuilder()
        .select('COUNT(*) AS total')
        .from(`(${queryFormMaster.getQuery()})`, 'sub')
        .setParameters(queryFormMaster.getParameters());
      const queryCountResult = await countQuery.getRawOne();
      queryFormMaster.limit(pageSize).offset((page - 1) * pageSize);
      const queryMasterResult = await queryFormMaster
        .orderBy('mrfi.MATERIAL_ID', 'DESC')
        .getRawMany();

      //CATALOG
      const queryFormCatalog = await Promise.all(
        queryMasterResult.map(async (mid) => {
          const { MATERIAL_ID } = mid;
          return await this.dataSource
            .getRepository(MaterialRequestCatalog)
            .createQueryBuilder('mrc')
            .select([
              'mrc.MATERIAL_ID',
              'mrc.CATALOG_GROUP',
              'mrc.CATALOG_CODE',
              'mrc.CATALOG_SEQ',
              'mrc.CATALOG_VALUE',
              'mrc.CATALOG_DESCRIPTION',
              'mr.CATALOG_NAME',
              "IIF(mr.ENABLE_FLAG='Y',CAST(1 AS BIT),CAST(0 AS BIT)) AS ENABLE_FLAG",
              'mr.INPUT_METHOD',
            ])
            .leftJoin(MaterialRule, 'mr', 'mr.CATALOG_CODE = mrc.CATALOG_CODE')
            .leftJoin(
              MaterialRequestFormItems,
              'mrfi',
              'mrc.MATERIAL_ID = mrfi.MATERIAL_ID',
            )
            .where('mrc.MATERIAL_ID = :MATERIAL_ID', { MATERIAL_ID })
            .getRawMany();
        }),
      );
      queryMasterResult.forEach((material) => {
        const materialID = String(material.MATERIAL_ID).trim();
        const matchCatalogs = queryFormCatalog.flat().filter((catalog) => {
          const catalogID = String(catalog.MATERIAL_ID).trim();
          return catalogID === materialID;
        });
        if (matchCatalogs.length > 0) {
          material.CODES = matchCatalogs.map((catalog) =>
            mapKeys(
              {
                CATALOG_CODE: catalog.CATALOG_CODE,
                CATALOG_NAME: catalog.CATALOG_NAME,
                CATALOG_GROUP: catalog.CATALOG_GROUP,
                CATALOG_VALUE: catalog.CATALOG_VALUE,
                CATALOG_SEQ: catalog.CATALOG_SEQ,
                CATALOG_DESCRIPTION: catalog.CATALOG_DESCRIPTION,
                CATALOG_ENABLE_FLAG: catalog.ENABLE_FLAG,
                CATALOG_INPUT_METHOD: catalog.INPUT_METHOD,
              },
              (value, key) => camelCase(key),
            ),
          );
        } else {
          // console.log(`No matches for MATERIAL_ID: ${materialID}`);
        }
      });

      const queryFormDetailsResult = queryMasterResult.map((item) =>
        mapKeys(item, (value, key) => camelCase(key)),
      );
      return {
        total: queryCountResult.total,
        datas: queryFormDetailsResult,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('申請單查詢失敗', false);
    }
  }
  async queryFormList(
    queryConditions: Partial<Record<string, string>>,
    empNo: string,
    isDepartmentBoss: boolean,
    isMaterialTeamMamber: boolean,
    queryDeptEmpList: EmpAll[],
  ) {
    try {
      const formNo = queryConditions.formNo;
      const statusCode = queryConditions.statusCode;
      const userId = queryConditions.userId;
      const page = Number(queryConditions.page) || 1; //頁數
      const pageSize = Number(queryConditions.pageSize) || 10; //每頁筆數
      const queryBuilder = this.dataSource
        .getRepository(MaterialRequestFormMaster)
        .createQueryBuilder('mrfm')
        .select([
          'mrfm.MASTER_ID',
          'mrfm.FORM_NO',
          'mrfm.USER_ID',
          'mrfm.STATUS_CODE',
          'mrfm.CREATED_BY',
          'mrfm.CREATED_DATE',
        ])
        .where('mrfm.USER_ID = :empNo', { empNo });

      //先判斷是否為料號小組，如果不是就在判斷是否為部門主管，若都不是就是一般使用者
      // isMaterialTeamMamber
      //   ? queryBuilder.where(`mrfm.STATUS_CODE NOT IN('N','O')`) //過濾掉草稿與作廢單據
      //   : isDepartmentBoss
      //     ? queryBuilder.where(
      //         `mrfm.USER_ID IN(:...queryDeptEmpList) AND mrfm.STATUS_CODE NOT IN('N','O')`, //過濾掉草稿與作廢單據
      //         {
      //           queryDeptEmpList: queryDeptEmpList.map((item) => item.empNo),
      //         },
      //       )
      //     : queryBuilder.where('mrfm.USER_ID=:empNo', { empNo });

      const parametersQueryConditions = [
        {
          condition: formNo,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestFormMaster, 'mrfms')
              .andWhere('mrfms.FORM_NO = :formNo', { formNo })
              .andWhere('mrfms.MASTER_ID = mrfm.MASTER_ID'),
        },
        {
          condition: statusCode,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestFormMaster, 'mrfms')
              .where('mrfms.STATUS_CODE IN(:...statusCode)', { statusCode })
              .andWhere('mrfms.MASTER_ID=mrfm.MASTER_ID'),
        },
        {
          condition: userId,
          subQuery: (qb) =>
            qb
              .subQuery()
              .select('*')
              .from(MaterialRequestFormMaster, 'mrfms')
              .where('mrfm.USER_ID=:userId', { userId })
              .andWhere('mrfms.MASTER_ID=mrfm.MASTER_ID'),
        },
      ];
      parametersQueryConditions.forEach(({ condition, subQuery }) => {
        if (condition) {
          queryBuilder.andWhere((qb) => {
            const query = subQuery(qb).getQuery();
            return `EXISTS (${query})`;
          });
        }
      });
      const countQuery = this.dataSource
        .createQueryBuilder()
        .select('COUNT(*) AS total')
        .from(`(${queryBuilder.getQuery()})`, 'sub')
        .setParameters(queryBuilder.getParameters());
      const queryCountResult = await countQuery.getRawOne();
      queryBuilder.limit(pageSize).offset((page - 1) * pageSize);
      const queryMasterResult = await queryBuilder
        .orderBy('mrfm.MASTER_ID', 'DESC')
        .getRawMany();
      const queryMasterFormResult = queryMasterResult.map((item) =>
        mapKeys(item, (value, key) => camelCase(key)),
      );
      return {
        total: queryCountResult.total,
        datas: queryMasterFormResult,
      };
    } catch (error) {
      throw new CustomHttpException('申請單查詢失敗', false);
    }
  }
  async queryMaterialDetails(formNo: string) {
    const queryDetailsData = [];
    try {
      const queryMaterialFormMaster = await this.materialRequestFormMaster.find(
        {
          where: {
            formNo: formNo,
          },
          select: [
            'masterId',
            'formNo',
            'statusCode',
            'userId',
            'createdBy',
            'updatedBy',
            'updatedDate',
            'submitDate',
          ],
        },
      );
      const queryMaterialFormMasterResult = { ...queryMaterialFormMaster[0] };
      const { masterId } = queryMaterialFormMasterResult;

      const queryMaterialFormItems = await this.dataSource
        .getRepository(MaterialRequestFormItems)
        .createQueryBuilder('mrfi')
        .select([
          'mrfi.MATERIAL_ID',
          'mrfi.MATERIAL_NO',
          'mrfi.PRIMARY_PLANT',
          'mrfi.MATERIAL_DESCRIPTION',
          'mrfi.REASON',
          'mrfi.REMARKS',
          'mrfi.BASE_UOM',
          'mrfi.WEIGHT_UOM',
          'mrfi.IS_SEMI_FINISHED',
          'mrfi.VALIDATION',
          'mrfi.TEMPLATE_CODE',
          'mrfi.SOURCE_DATA',
          'mt.TEMPLATE_NAME',
        ])
        .innerJoin(
          MaterialTemplate,
          'mt',
          'mt.TEMPLATE_CODE=mrfi.TEMPLATE_CODE',
        )
        .where(`MASTER_ID=:masterId AND ISNULL(mrfi.IS_DELETED,'N') <>'Y'`, {
          masterId,
        })
        .getRawMany();
      const queryMaterialSecondPlant = await Promise.all(
        queryMaterialFormItems.map(async (item) => {
          const { MATERIAL_ID } = item;
          return await this.materialRequestPlant.find({
            select: ['materialId', 'plant'],
            where: { materialId: MATERIAL_ID },
          });
        }),
      );

      for (const mfi of queryMaterialFormItems) {
        const mcrMaterialId = mfi.MATERIAL_ID;
        const queryMaterialPlantResult = await this.materialRequestPlant
          .createQueryBuilder()
          .select([
            'PROC_TYPE AS procType',
            'SPPROC_TYPE AS spprocType',
            'PUR_UOM AS purUom',
            'PUR_GROUP AS purGroup',
            'PRODUCT_UOM AS productUom',
            'SALES_UOM AS salesUom',
            'MRP_TYPE AS mrpType',
            'DEP_REQ_ID AS depReqId',
            `IIF(WORK_SCHED_VIEW='Y',CAST(1 AS BIT), CAST(0 AS BIT)) AS workSchedView`,
            'PRODPROF AS prodprof',
            'LOTSIZEKEY AS lotsizekey',
            `IIF(IND_POST_TO_INSP_STOCK='Y',CAST(1 AS BIT), CAST(0 AS BIT)) AS indPostToInspStock`,
            `IIF(SOURCELIST='Y',CAST(1 AS BIT), CAST(0 AS BIT)) AS sourcelist`,
            'PURCHASE_ORDER_CONTENT AS purchaseOrderContent',
            'DELYG_PLNT AS delygPlnt',
          ])
          .where('MATERIAL_ID=:mcrMaterialId ', { mcrMaterialId })
          .groupBy(
            'PROC_TYPE,SPPROC_TYPE,PUR_UOM,PUR_GROUP,PRODUCT_UOM,SALES_UOM,MRP_TYPE,DEP_REQ_ID,WORK_SCHED_VIEW,PRODPROF,LOTSIZEKEY,IND_POST_TO_INSP_STOCK,SOURCELIST,PURCHASE_ORDER_CONTENT,DELYG_PLNT',
          )
          .getRawMany();
        const [
          {
            procType,
            spprocType,
            purUom,
            purGroup,
            productUom,
            salesUom,
            mrpType,
            depReqId,
            workSchedView,
            prodprof,
            lotsizekey,
            indPostToInspStock,
            sourcelist,
            purchaseOrderContent,
            delygPlnt,
          } = {},
        ] = queryMaterialPlantResult || [];
        const queryMrpController = await this.materialRequestPlant
          .createQueryBuilder()
          .select(['PLANT AS plant', 'MRP_CONTROLLER AS controller'])
          .where('MATERIAL_ID=:mcrMaterialId ', { mcrMaterialId })
          .getRawMany();

        const queryMaterialCatologResult = await this.materialRequestCatalog
          .createQueryBuilder('mrc')
          .innerJoin(MaterialRule, 'mr', 'mr.CATALOG_CODE=mrc.CATALOG_CODE')
          .innerJoin(MaterialLovData, 'mld', 'mld.LOV_GROUP=mrc.CATALOG_GROUP')
          .where('mrc.MATERIAL_ID=:mcrMaterialId', { mcrMaterialId })
          .select([
            'mrc.MATERIAL_ID AS materialId',
            'mrc.CATALOG_GROUP AS catalogGroup',
            'mrc.CATALOG_CODE AS catalogCode',
            'mrc.CATALOG_SEQ AS catalogSeq',
            'mrc.CATALOG_VALUE AS catalogValue',
            'mrc.CATALOG_DESCRIPTION AS catalogDescription',
            'mrc.INPUT_METHOD AS inputMethod',
            'mld.ENABLE_FLAG AS enableFlag',
            'mr.CATALOG_NAME AS catalogName',
          ])
          .groupBy(
            'mrc.MATERIAL_ID,mrc.CATALOG_GROUP,mrc.CATALOG_CODE,mrc.CATALOG_SEQ,mrc.CATALOG_VALUE, mrc.CATALOG_DESCRIPTION,mrc.INPUT_METHOD,mld.ENABLE_FLAG,mr.CATALOG_NAME',
          )
          .getRawMany();
        const queryCharacteristicValue =
          await this.materialRequestItemsUom.findOne({
            where: { materialId: mcrMaterialId },
          });
        //料號是否產生中間料號
        const getGenSemiFinishedSpecialCode = queryMaterialCatologResult.find(
          (item) => item.catalogGroup?.startsWith('SPECIAL_CODE1'), //取特徵碼1，暫時Hard Code
        )?.catalogValue;
        const getGenSemiFinishedTemplateCode = queryMaterialFormItems.find(
          (item) => item.MATERIAL_ID === mcrMaterialId,
        )?.TEMPLATE_CODE;
        const isGenSemiFinished = await this.materialAutomap.find({
          where: {
            mainTemplateCode: getGenSemiFinishedTemplateCode,
            typeKind: getGenSemiFinishedSpecialCode,
          },
        });
        queryDetailsData.push({
          materialId: mfi.MATERIAL_ID,
          materialNo: mfi.MATERIAL_NO,
          //TemplateCode與TypeKind存在於AutoMap，且不為中間料號才出現產生中間料號按鈕
          genSemiFinished:
            isGenSemiFinished.length > 0 && mfi.IS_SEMI_FINISHED !== 'Y'
              ? true
              : false,
          primaryPlant: mfi.PRIMARY_PLANT,
          secondPlant:
            queryMaterialSecondPlant.length > 0
              ? queryMaterialSecondPlant
                  .filter(
                    (item) => item[0] && item[0].materialId === mcrMaterialId,
                  )
                  .flatMap((item) =>
                    item
                      .map((subItem) => subItem.plant)
                      .filter((plant) => plant !== mfi.PRIMARY_PLANT),
                  )
              : '',
          materialDescription: mfi.MATERIAL_DESCRIPTION,
          reason: mfi.REASON,
          remarks: mfi.REMARKS,
          baseUom: mfi.BASE_UOM,
          weightUom: mfi.WEIGHT_UOM,
          validation: mfi.VALIDATION === 'Y' ? true : false,
          isSemiFinished: mfi.IS_SEMI_FINISHED === 'Y' ? true : false,
          templateCode: mfi.TEMPLATE_CODE,
          templateName: mfi.TEMPLATE_NAME,
          sourceData: mfi.SOURCE_DATA,
          lovGroups: queryMaterialCatologResult
            .filter((item) => item.materialId === mfi.MATERIAL_ID)
            .map((item) => ({
              materialId: item.materialId,
              catalogGroup: item.catalogGroup,
              catalogCode: item.catalogCode,
              catalogSeq: item.catalogSeq,
              catalogValue: item.catalogValue,
              catalogDescription: item.catalogDescription,
              inputMethod: item.inputMethod,
              enableFlag: item.enableFlag === 'Y' ? true : false,
              catalogName: item.catalogName,
            })),
          sapData: {
            procType: spprocType ? `${procType}/${spprocType}` : procType,
            purUom: purUom,
            purGroup: purGroup,
            productUom: productUom,
            salesUom: salesUom,
            mrpType: mrpType,
            depReqId: depReqId,
            workSchedView: workSchedView,
            prodprof: prodprof,
            lotsizekey: lotsizekey,
            indPostToInspStock: indPostToInspStock,
            sourcelist: sourcelist,
            purchaseOrderContent: purchaseOrderContent,
            delygPlnt: delygPlnt,
            mrpController: queryMrpController,
            characteristic: queryCharacteristicValue?.characteristic,
            basicUnitQty: queryCharacteristicValue?.basicUnitQty,
            alternativeUomQty: queryCharacteristicValue?.alternativeUomQty,
            alternativeUom: queryCharacteristicValue?.alternativeUom,
          },
        });
      }
      //表單簽核狀態
      const queryApprovedStatus =
        await this.approvedLogService.getMaterialApprovedLog(masterId);
      return {
        ...queryMaterialFormMasterResult,
        approvedStatus: queryApprovedStatus,
        codes: queryDetailsData,
      };
    } catch (error) {
      throw new CustomHttpException('申請單Details查詢失敗', false);
    }
  }
  async deleteMaterialRequest(deleteParams, { empNo, empName }) {
    const { formId, materialId } = deleteParams;
    const queryRunner = this.dataSource.createQueryRunner();
    if (formId) {
      try {
        await queryRunner.startTransaction();
        await queryRunner.manager
          .createQueryBuilder()
          .update(MaterialRequestFormItems)
          .set({
            isDeleted: 'Y',
            deletedMaterial: () => 'MATERIAL_NO',
            materialNo: () => 'NEXT VALUE FOR DeleteMaterialRequestSequence',
          })
          .where(
            `EXISTS (
            SELECT 1
            FROM MATERIAL_REQUEST_FORM_MASTER mrfm
            WHERE mrfm.MASTER_ID = MATERIAL_REQUEST_FORM_ITEMS.MASTER_ID
            AND mrfm.MASTER_ID = :formId)`,
            { formId },
          )
          .execute();
        await queryRunner.manager
          .createQueryBuilder()
          .update(MaterialRequestFormMaster)
          .set({
            statusCode: 'O',
          })
          .where('MASTER_ID = :formId', { formId })
          .execute();
        await this.approvedLogService.createMaterialApprovedLog({
          masterId: formId,
          approver: empNo,
          approveTemplate: 'APPROVE_FLOW1',
          stageType: 'APPLICANT',
          status: 'REJECT',
          reason: '申請者作廢',
          rank: 0,
        });
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new CustomHttpException('作廢申請單發生錯誤', false);
      }
    } else {
      try {
        await queryRunner.startTransaction();
        await queryRunner.manager
          .createQueryBuilder()
          .update(MaterialRequestFormItems)
          .set({
            isDeleted: 'Y',
            deletedMaterial: () => 'MATERIAL_NO',
            materialNo: () => 'NEXT VALUE FOR DeleteMaterialRequestSequence',
          })
          .where('MATERIAL_ID=:materialId', { materialId })
          .execute();
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new CustomHttpException('刪除單一物料發生錯誤', false);
      }
    }
  }
  //後端API取批次特性名稱
  async queryCharacteristicName(baseUom: string, alternativeUom: string) {
    const result = await this.materialLovData
      .createQueryBuilder('mld')
      .where(
        '(mld.attrV1=:baseUom OR mld.attrV2=:baseUom) AND (mld.attrV1=:alternativeUom OR mld.attrV2=:alternativeUom)',
        { baseUom, alternativeUom },
      )
      .getOne();
    if (!result) {
      return 'NO MATCH CHARACTERISTIC_NAME';
    }
    return result.lovCode;
  }

  //前端API取SAP頁面靜態欄位值
  async querySapLovCodes(groupCode: string) {
    //轉DB的命名格式
    const queryGroupCode = snakeCase(groupCode).toUpperCase();
    if (queryGroupCode === 'BATCH_VALUE') {
      const queryGroupCodeResult = await this.materialLovData.find({
        select: [
          'lovGroup',
          'lovCode',
          'attrV1',
          'attrV2',
          'parentLovValue',
          'lovDescription',
        ],
        where: { lovGroup: queryGroupCode },
      });
      const batchValueFormat = queryGroupCodeResult.map((item) => {
        const key = `${item.attrV1}_${item.attrV2}`;
        return {
          key,
          ...item,
        };
      });
      return batchValueFormat;
    } else {
      const queryGroupCodeResult = await this.materialLovData.find({
        select: [
          'lovGroup',
          'lovCode',
          'attrV1',
          'attrV2',
          'parentLovValue',
          'lovDescription',
        ],
        where: { lovGroup: queryGroupCode },
      });
      return queryGroupCodeResult;
    }
  }

  async editMaterialRequest(editParams) {
    const { masterId, codes } = editParams;
    const formStatus = await this.materialRequestFormMaster.find({
      select: ['statusCode', 'formNo'],
      where: { masterId: masterId },
    });
    const formNo = formStatus[0].formNo;
    const formStatusCode = formStatus[0].statusCode;
    //狀態非N不可修改
    if (formStatusCode !== 'N' && formStatusCode !== 'P') {
      return {
        success: false,
        message: '目前狀態已不可修改',
      };
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const [
        {
          materialNo,
          materialId,
          primaryPlant,
          secondPlant = [],
          transferPlant,
          templateCode,
          materialDescription,
          reason,
          remarks,
          baseUom,
          weightUom,
          lovGroups,
          sapData,
          validation,
        },
      ] = codes;
      const {
        procType = null,
        purUom = null,
        purGroup = null,
        productUom = null,
        salesUom = null,
        mrpType = null,
        depReqId = null,
        workSchedView = null,
        prodprof = null,
        lotsizekey = null,
        indPostToInspStock = null,
        sourcelist = null,
        purchaseOrderContent = null,
        delygPlnt = null,
        mrpController = null,
        basicUnitQty = null,
        alternativeUomQty = null,
        alternativeUom = null,
        characteristic = null,
      } = sapData || {};
      const plants = [...secondPlant, primaryPlant];
      const splitSpprocType = (procType || '').split('/');
      await queryRunner.manager
        .getRepository(MaterialRequestCatalog)
        .delete({ materialId: materialId });
      await queryRunner.manager.getRepository(MaterialRequestFormItems).update(
        { materialId: materialId },
        {
          materialNo: materialNo,
          primaryPlant: primaryPlant,
          transferPlant: transferPlant,
          templateCode: templateCode,
          materialDescription: materialDescription,
          reason: reason,
          remarks: remarks,
          validation: validation,
          baseUom: baseUom,
          weightUom: weightUom,
        },
      );
      for (const data of lovGroups) {
        await queryRunner.manager.getRepository(MaterialRequestCatalog).insert({
          materialId: materialId,
          masterId: masterId,
          catalogGroup: data.lovGroup,
          catalogValue: data.lovCode,
          catalogDescription: data.lovDescription,
          catalogCode: data.catalogCode,
          inputMethod: data.inputMethod,
          catalogSeq: data.catalogSeq,
          updatedDate: new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei',
            hour12: false,
          }),
        });
      }
      const queryPlantMaterialId = await this.materialRequestPlant.find({
        select: ['materialId'],
        where: {
          materialId: materialId,
        },
      });
      //Plant層MaterialId不存在就新增
      if (queryPlantMaterialId.length === 0) {
        for (const plant of plants) {
          const plantController =
            mrpController.length > 0
              ? mrpController.find((item) => item.plant === plant)?.controller
              : null;
          await queryRunner.manager.getRepository(MaterialRequestPlant).insert({
            materialId: materialId,
            plant: plant,
            procType:
              procType && splitSpprocType.length > 0
                ? plant !== primaryPlant
                  ? 'F'
                  : splitSpprocType[0]
                : '',
            spprocType:
              procType && splitSpprocType.length > 0
                ? plant !== primaryPlant
                  ? primaryPlant.substring(0, 2)
                  : splitSpprocType[1]
                : '',
            purUom: purUom || '',
            purGroup: purGroup || '',
            productUom: productUom || '',
            salesUom: salesUom || '',
            mrpType: mrpType || '',
            depReqId: depReqId || '',
            workSchedView: workSchedView || '',
            prodprof: prodprof || '',
            lotsizekey: lotsizekey || '',
            indPostToInspStock: indPostToInspStock || '',
            sourcelist: sourcelist || '',
            purchaseOrderContent: purchaseOrderContent || '',
            delygPlnt: delygPlnt || '',
            mrpController: plantController || '',
            updatedDate: new Date().toLocaleString('zh-TW', {
              timeZone: 'Asia/Taipei',
              hour12: false,
            }),
          });
        }
        //Plant層MaterialId存在就更新
      } else {
        for (const plant of plants) {
          const plantController =
            mrpController.length > 0
              ? mrpController.find((item) => item.plant === plant)?.controller
              : null;
          await queryRunner.manager.getRepository(MaterialRequestPlant).update(
            { materialId: materialId, plant: plant },
            {
              procType:
                procType && splitSpprocType.length > 0
                  ? plant !== primaryPlant
                    ? 'F'
                    : splitSpprocType[0]
                  : '',
              spprocType:
                procType && splitSpprocType.length > 0
                  ? plant !== primaryPlant
                    ? primaryPlant.substring(0, 2)
                    : splitSpprocType[1]
                  : '',
              purUom: purUom || '',
              purGroup: purGroup || '',
              productUom: productUom || '',
              salesUom: salesUom || '',
              mrpType: mrpType || '',
              depReqId: depReqId || '',
              workSchedView: workSchedView || '',
              prodprof: prodprof || '',
              lotsizekey: lotsizekey || '',
              indPostToInspStock: indPostToInspStock || '',
              sourcelist: sourcelist || '',
              purchaseOrderContent: purchaseOrderContent || '',
              delygPlnt: delygPlnt || '',
              mrpController: plantController || '',
              updatedDate: new Date().toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                hour12: false,
              }),
            },
          );
        }
      }

      await queryRunner.manager.getRepository(MaterialRequestItemsUom).update(
        { materialId: materialId },
        {
          basicUnitQty: basicUnitQty,
          alternativeUomQty: alternativeUomQty,
          alternativeUom: alternativeUom,
          characteristicName: characteristic
            ? await this.queryCharacteristicName(baseUom, alternativeUom)
            : 'NO MATCH CHARACTERISTIC_NAME',
          characteristic: characteristic,
          lastUpdateDate: new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei',
            hour12: false,
          }),
        },
      );
      await queryRunner.commitTransaction();
      return {
        success: true,
        message: '物料編輯成功',
        data: formNo,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      throw new CustomHttpException('物料編輯失敗', false);
    }
  }
  async submitFormRequest(masterId: number) {
    try {
      const submitDate = new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour12: false,
      });
      const queryForm = await this.materialRequestFormMaster.findOne({
        where: { masterId: masterId },
      });
      const queryMaterialItems = await this.materialRequestFormItems.find({
        select: ['validation'],
        where: { masterId: queryForm.masterId },
      });
      const validItems = queryMaterialItems.filter(
        (item) => item.validation === false,
      );
      //申請單狀態為草稿或編輯中間料號且物料驗證全通過才可送出
      if (queryForm.statusCode === 'N' && validItems.length === 0) {
        queryForm.submitDate = new Date(submitDate);
        queryForm.statusCode = 'S';
        await this.materialRequestFormMaster.save(queryForm);
        return {
          success: true,
          message: '申請單送出成功',
        };
      } else {
        return {
          success: false,
          message: '申請單送出失敗:物料未驗證通過或申請單非可送出狀態',
        };
      }
    } catch (error) {
      throw new CustomHttpException('申請單送出發生錯誤', false);
    }
  }
  // async postSapDatas(functionName: string, params: any) {
  //   const result = await this.sapService.sapFunction(functionName, params);
  // }
  //依照設定順序，自動產生物料說明
  async autoGenerateMaterialDescription({ templateCode, catalogCode }) {
    const queryDataFromEdge = await this.materialLovData.find({
      select: ['lovGroup'],
      where: { fromEdgeData: true },
    });
    const queryDataResult = await Promise.all(
      catalogCode.map(async (code) => {
        //判斷CATALOG_CODE的Source Data
        const dataSourceResult = queryDataFromEdge.some(
          (item) => item.lovGroup === code.lovGroup,
        );
        const queryLovCodeSeq = await this.materialRuleRepository.find({
          select: ['descriptionSeq'],
          where: {
            templateCode: templateCode,
            lovGroup: code.lovGroup,
          },
        });
        const queryTemplateLovData = dataSourceResult
          ? //外圍資料庫
            ((
              await this.componentCode.find({
                select: ['componentItemNumber'],
                where: { componentCode: code.lovCode },
              })
            ).length > 0 &&
              (await this.componentCode
                .createQueryBuilder('componentCode')
                .select('componentCode.componentItemNumber', 'LOV_CODE')
                .addSelect(
                  `${queryLovCodeSeq[0].descriptionSeq} AS "DESCRIPTION_SEQ"`, //Postgres預設會將欄位轉成小寫，加入雙引號維持大寫
                )
                .addSelect(`'BOM_CODE' AS "CATALOG_GROUP"`)
                .where('componentCode.componentCode = :lovCode', {
                  lovCode: code.lovCode,
                })
                .getRawMany())) ||
            (await this.temDrawingCode
              .createQueryBuilder('temDrawingCode')
              .select('temDrawingCode.oldDrawingCode', 'LOV_CODE')
              .addSelect(
                `${queryLovCodeSeq[0].descriptionSeq} AS "DESCRIPTION_SEQ"`,
              )
              .addSelect(`'DRAWING' AS "CATALOG_GROUP"`)
              .where('temDrawingCode.newDrawingCode = :lovCode', {
                lovCode: code.lovCode,
              })
              .getRawOne()) ||
            (await this.fccDrawingCode
              .createQueryBuilder('fccDrawingCode')
              .select('fccDrawingCode.oldDrawingCode', 'LOV_CODE')
              .addSelect(
                `${queryLovCodeSeq[0].descriptionSeq} AS "DESCRIPTION_SEQ"`,
              )
              .addSelect(`'DRAWING' AS "CATALOG_GROUP"`)
              .where('fccDrawingCode.newDrawingCode = :lovCode', {
                lovCode: code.lovCode,
              })
              .getRawOne())
          : //EIP資料庫
            await this.materialRuleRepository
              .createQueryBuilder('mr')
              .select([
                'mr.CATALOG_CODE',
                'mr.CATALOG_GROUP',
                'mr.DESCRIPTION_SEQ',
                'mld.LOV_CODE',
                'mld.LOV_DESCRIPTION',
              ])
              .where('mr.TEMPLATE_CODE=:templateCode', { templateCode })
              .innerJoin(
                MaterialLovData,
                'mld',
                'mld.LOV_GROUP=mr.CATALOG_GROUP',
              )
              .andWhere('mr.DESCRIPTION_SEQ IS NOT NULL')
              .andWhere('mld.LOV_CODE=:lovCode', code) //解構lovCode屬性，並排除需要從外圍取得資料的欄位
              .andWhere('mld.LOV_GROUP=:lovGroup', code) //解構lovGroup屬性
              .andWhere("mld.DESCRIPTION_COMBINATION='Y'")
              .getRawMany();
        return queryTemplateLovData;
      }),
    );
    const flatData = queryDataResult.flat();
    const filterData = flatData.filter(
      (item) => item.CATALOG_GROUP !== 'BOM_CODE',
    );
    const filterBomCode = flatData.filter(
      (item) => item.CATALOG_GROUP === 'BOM_CODE',
    );
    const mergeBomCode = filterBomCode.map((item) => item.LOV_CODE).join('/');
    const mergedBOMCodeItem = {
      LOV_CODE: mergeBomCode, //多個BomCode合併
      DESCRIPTION_SEQ: filterBomCode[0].DESCRIPTION_SEQ, // 保留第一筆資料的 DESCRIPTION_SEQ
      CATALOG_GROUP: filterBomCode[0].CATALOG_GROUP, // 保留第一筆資料的 CATALOG_GROUP
    };
    filterData.push(mergedBOMCodeItem);
    const sortData = filterData.sort(
      (a, b) => a.DESCRIPTION_SEQ - b.DESCRIPTION_SEQ,
    );
    const combineResult = sortData
      .map((item) => item.LOV_DESCRIPTION || item.LOV_CODE)
      .join(',');
    return combineResult;
  }

  async getFormsOwner({ queryFormsOwner }) {
    const { empNo, isMaterialTeamMamber, queryDeptEmpList, isDepartmentBoss } =
      queryFormsOwner;
    const deptEmplist = queryDeptEmpList.map((item) => item.empNo);
    //編輯中的單據
    const queryEditForms = await this.materialRequestFormMaster.findAndCount({
      where: {
        userId: empNo,
        statusCode: In(['N', 'P']),
      },
    });
    //送簽中的單據
    const queryPendingForms = await this.materialRequestFormMaster.findAndCount(
      {
        where: {
          userId: empNo,
          statusCode: In(['S', 'B', 'M']),
        },
      },
    );
    //料號小組待簽核單據
    const queryMaterialTeamForms = isMaterialTeamMamber
      ? await this.materialRequestFormMaster.findAndCount({
          where: {
            statusCode: In(['B', 'M']),
          },
        })
      : 0;
    //部門主管待簽核單據
    const queryDepartmentBossForms = isDepartmentBoss
      ? await this.materialRequestFormMaster.findAndCount({
          where: {
            userId: In(deptEmplist),
            statusCode: 'S',
          },
        })
      : 0;
    return {
      //數量在索引1
      edit: queryEditForms[1],
      pending: queryPendingForms[1],
      applyToBoss: isDepartmentBoss
        ? queryDepartmentBossForms[1]
        : queryDepartmentBossForms,
      applyToMaterialTeam: isMaterialTeamMamber
        ? queryMaterialTeamForms[1]
        : queryMaterialTeamForms,
    };
  }
  async getPendingForms({
    isDepartmentBoss,
    isMaterialTeamMamber,
    queryDeptEmpList,
    empNo,
  }) {
    // const { formNo, isDepartmentBoss, isMaterialTeamMamber, queryDeptEmpList } =
    //   queryConditions;

    if (isDepartmentBoss) {
      const deptEmpList = queryDeptEmpList.map((item) => item.empNo);
      const queryPendingForms = await this.materialRequestFormMaster.find({
        select: [
          'masterId',
          'formNo',
          'userId',
          'statusCode',
          'createdBy',
          'createdDate',
        ],
        order: {
          createdDate: 'DESC',
        },
        where: {
          statusCode: 'S',
          userId: In(deptEmpList),
        },
      });
      return queryPendingForms;
    } else if (isMaterialTeamMamber) {
      const queryPendingForms = await this.materialRequestFormMaster.find({
        select: [
          'masterId',
          'formNo',
          'userId',
          'statusCode',
          'createdBy',
          'createdDate',
        ],
        order: {
          createdDate: 'DESC',
        },
        where: {
          statusCode: In(['B', 'M']),
        },
      });
      return queryPendingForms;
    } else {
      const queryPendingForms = await this.materialRequestFormMaster.find({
        select: [
          'masterId',
          'formNo',
          'userId',
          'statusCode',
          'createdBy',
          'createdDate',
        ],
        order: {
          createdDate: 'DESC',
        },
        where: {
          statusCode: In(['N', 'P']),
          userId: empNo,
        },
      });
      return queryPendingForms;
    }
  }
}
