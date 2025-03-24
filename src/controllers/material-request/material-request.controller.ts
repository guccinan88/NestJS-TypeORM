import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomHttpException } from 'src/filters/http-exception/http-exception.filter';
import { MaterialRequestService } from 'src/service/material-request/material-request.service';
import { Request } from 'express';
import { UserService } from 'src/service/auth/user.service';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth/auth.guard';
@Controller('material-request')
export class MaterialRequestController {
  constructor(
    private readonly materialRequestService: MaterialRequestService,
    private readonly userService: UserService,
  ) {}
  //一開始進頁面拿取Template_Code
  @Get('template-code')
  @ApiOperation({ summary: '取得Template' })
  @UseGuards(AuthGuard)
  async templateCode() {
    const groupCodeResult =
      await this.materialRequestService.queryTemplateCodeAll();
    return { group_code: groupCodeResult };
  }
  //選完Template_Code後取得下一層級綁定的欄位值
  @Get('template-items')
  @ApiOperation({ summary: '取得Template Rule Items' })
  @ApiQuery({ name: 'templateCode', required: true, description: '模板代號' })
  async templateItems(@Query('templateCode') templateCode: string) {
    const templateItemsResult =
      await this.materialRequestService.queryTemplateItems(templateCode);
    return templateItemsResult;
  }
  //取圖號，資料在外圍DB
  @Get('drawing-code')
  @ApiOperation({ summary: '取得圖號' })
  @ApiQuery({ name: 'groupCode', required: true, description: '物料群組編碼' })
  @ApiQuery({
    name: 'productBigCode',
    required: true,
    description: '產品階層(大)',
  })
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
  @ApiOperation({ summary: '取得成分代碼' })
  async componentCode() {
    return this.materialRequestService.queryComponentCode();
  }

  @Get('query-request-materials')
  async getMaterialRequest(
    @Query() query: Partial<Record<string, string>>,
    @Req() requets: Request,
  ) {
    try {
      const jwtCookie = requets.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const {
        empNo,
        isDepartmentBoss,
        isMaterialTeamMamber,
        queryDeptEmpList,
      } = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const queryResult = await this.materialRequestService.queryMaterialList(
        query,
        empNo,
        isDepartmentBoss,
        isMaterialTeamMamber,
        queryDeptEmpList,
      );
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
  async getFormsRequest(
    @Query() query: Partial<Record<string, string>>,
    @Req() requets: Request,
  ) {
    try {
      const jwtCookie = requets.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const {
        empNo,
        isDepartmentBoss,
        isMaterialTeamMamber,
        queryDeptEmpList,
      } = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const queryResult = await this.materialRequestService.queryFormList(
        query,
        empNo,
        isDepartmentBoss,
        isMaterialTeamMamber,
        queryDeptEmpList,
      );

      return {
        success: true,
        message: '清單查詢成功',
        data: queryResult,
      };
    } catch (error) {
      console.error(error);
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
  async createMaterialRequest(@Body() createFormDto, @Req() requets: Request) {
    try {
      const jwtCookie = requets.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      return await this.materialRequestService.createMaterialRequestForm(
        createFormDto,
        { jwtCookie },
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
  @Post('generate-semifinished-materials')
  async generateSemifinishedMaterials(@Query('materialId') materialId: string) {
    try {
      const generateResult =
        await this.materialRequestService.semifinishedMaterials(materialId);
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
  @Get('generate-material-description')
  async generateMaterialDescription(
    @Query('templateCode') templateCode: string,
    @Query('catalogCode') catalogCode: string,
  ) {
    try {
      await this.materialRequestService.autoGenerateMaterialDescription({
        templateCode,
        catalogCode,
      });
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('自動產生說明失敗', false);
    }
  }
  @Get('current-user-identity')
  async currentUserIdentity(@Req() requets: Request) {
    try {
      const jwtCookie = requets.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryResult = await this.userService.getUserIdentity({ jwtCookie });
      return {
        success: true,
        message: '查詢成功',
        data: queryResult,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('取得身分失敗', false);
    }
  }
  @Patch('department-boss-check')
  async departmentBossCheck(@Body() request) {
    try {
      const updateResult = await this.userService.signatureForm({
        request,
        statusCode: 'B',
      });
      return {
        success: true,
        message: '簽核成功',
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('單位主管簽核失敗', false);
    }
  }
  @Patch('material-team-check')
  @UseGuards(AuthGuard)
  async materialTeamCheck(@Body() request) {
    try {
      const updateResult = await this.userService.signatureForm({
        request,
        statusCode: 'V',
      });
      return {
        success: true,
        message: '簽核成功',
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('料號小組簽核失敗', false);
    }
  }
  @Patch('department-boss-return')
  async departmentBossReturn(@Body() request) {
    try {
      const updateResult = await this.userService.signatureForm({
        request,
        statusCode: 'N',
      });
      return {
        success: true,
        message: '退簽成功',
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('退簽失敗', false);
    }
  }
  @Patch('material-team-return')
  async materialTeamReturn(@Body() request) {
    const semiReturnStatus = request.semiReturn;
    if (semiReturnStatus) {
      try {
        const updateResult = await this.userService.signatureForm({
          request,
          statusCode: 'P',
        });
        return {
          success: true,
          message: '退簽成功',
        };
      } catch (error) {
        throw new CustomHttpException('退簽失敗', false);
      }
    } else {
      try {
        const updateResult = await this.userService.signatureForm({
          request,
          statusCode: 'N',
        });
        return {
          success: true,
          message: '退簽成功',
        };
      } catch (error) {
        throw new CustomHttpException('退簽失敗', false);
      }
    }
  }
  @Patch('semifinished-material-check')
  async semifinishedMaterialCheck(@Body() request) {
    try {
      const updateResult = await this.userService.signatureForm({
        request,
        statusCode: 'M',
      });
      return {
        success: true,
        message: '中間料號確認完成',
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('中間料號確認失敗', false);
    }
  }
  @Get('current-forms-owner')
  async currentFormsOwner(@Req() requets: Request) {
    try {
      const jwtCookie = requets.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryFormsOwner = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const queryResult = await this.materialRequestService.getFormsOwner({
        queryFormsOwner,
      });
      return {
        success: true,
        message: '查詢成功',
        data: queryResult,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('取得身分失敗', false);
    }
  }
}
