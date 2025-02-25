import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomHttpException } from 'src/filters/http-exception/http-exception.filter';
import { MaterialRequestService } from 'src/service/material-request/material-request.service';

@Controller('material-request')
export class MaterialRequestController {
  constructor(
    private readonly materialRequestService: MaterialRequestService,
  ) {}
  //一開始進頁面拿取Template_Code
  @Get('template-code')
  async templateCode() {
    const groupCodeResult =
      await this.materialRequestService.queryTemplateCodeAll();
    return { group_code: groupCodeResult };
  }
  //選完Template_Code後取得下一層級綁定的欄位值
  @Get('template-items')
  async templateItems(@Query('templateCode') templateCode: string) {
    const templateItemsResult =
      await this.materialRequestService.queryTemplateItems(templateCode);
    return templateItemsResult;
  }
  //取圖號，資料在外圍DB
  @Get('drawing-code')
  async drawingCode(
    @Query('groupCode') groupCode: string,
    @Query('productBigCode') productBigCode: string,
  ) {
    const result = await this.materialRequestService.queryDrawingCode(
      groupCode,
      productBigCode,
    );
    return result;
  }
  //取成分代碼，資料在外圍DB
  @Get('component-code')
  async componentCode() {
    return this.materialRequestService.queryComponentCode();
  }

  @Get('query-request-materials')
  async getMaterialRequest(@Query() query: Partial<Record<string, string>>) {
    try {
      const queryResult =
        await this.materialRequestService.queryMaterialList(query);
      return {
        success: true,
        message: '清單查詢成功',
        data: queryResult,
      };
    } catch (error) {
      throw new CustomHttpException('清單查詢失敗', false);
    }
  }
  @Get('query-request-form')
  async getFormsRequest(@Query() query: Partial<Record<string, string>>) {
    try {
      const queryResult =
        await this.materialRequestService.queryFormList(query);
      return {
        success: true,
        message: '清單查詢成功',
        data: queryResult,
      };
    } catch (error) {
      throw new CustomHttpException('清單查詢失敗', false);
    }
  }

  @Get('query-details')
  async getMaterialRequestDetails(@Query() query: Record<string, string>) {
    try {
      const queryResult =
        await this.materialRequestService.queryMaterialDetails(query.formNo);
      return {
        success: true,
        message: '清單查詢成功',
        data: queryResult,
      };
    } catch (error) {
      throw new CustomHttpException('Details查詢失敗', false);
    }
  }

  @Post('create-form')
  async createMaterialRequest(@Body() createFormDto) {
    try {
      return await this.materialRequestService.createMaterialRequestForm(
        createFormDto,
      );
    } catch (error) {
      return {
        success: false,
        message: 'Controller發生錯誤',
        errorMsg: error,
      };
    }
  }

  @Patch('edit-form')
  async editMaterialRequest(@Body() editFormDto) {
    try {
      return await this.materialRequestService.editMaterialRequest(editFormDto);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('編輯資料Controller發生錯誤', false);
    }
  }

  @Delete('delete-form')
  async deleteMaterialRequest(@Body() deleteForm) {
    try {
      await this.materialRequestService.deleteMaterialRequest(deleteForm);
      return {
        success: true,
        message: '刪除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '刪除失敗',
      };
    }
  }
  @Get('lov-list')
  async getSapLovCode(@Query() query: Record<string, string>) {
    try {
      const queryResult = await this.materialRequestService.querySapLovCodes(
        query.group,
      );
      return {
        success: true,
        message: '查詢成功',
        data: queryResult,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('查詢失敗', false);
    }
  }
  @Post('submit-form')
  async submitForm(@Body() formMasterId) {
    try {
      const { masterId } = formMasterId;
      return await this.materialRequestService.submitFormRequest(masterId);
    } catch (error) {
      throw new CustomHttpException('申請單送出失敗', false);
    }
  }
  @Get('generate-semifinished-materials')
  async generateSemifinishedMaterials(
    @Query('templateCode') templateCode: string,
    @Query('materialId') materialId: string,
  ) {
    try {
      const generateResult =
        await this.materialRequestService.semifinishedMaterials(
          templateCode,
          materialId,
        );
      return {
        success: true,
        message: '中間料號產生成功',
        data: generateResult,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('查詢失敗', false);
    }
  }
}
