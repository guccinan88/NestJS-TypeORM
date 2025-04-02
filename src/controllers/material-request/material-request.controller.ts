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
import { ApproveService } from 'src/service/approve/approve.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialRequestFormMaster } from 'src/entities';
import { Repository } from 'typeorm';
@Controller('material-request')
export class MaterialRequestController {
  constructor(
    private readonly materialRequestService: MaterialRequestService,
    private readonly userService: UserService,
    private readonly approveService: ApproveService,
    @InjectRepository(MaterialRequestFormMaster, 'msConnection')
    private readonly materialRequestFormMaster: Repository<MaterialRequestFormMaster>,
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
    @Req() request: Request,
  ) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
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
    @Req() request: Request,
  ) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
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
  async createMaterialRequest(@Body() createFormDto, @Req() request: Request) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
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
  async deleteMaterialRequest(@Body() deleteForm, @Req() request: Request) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const { empNo, empName } = queryUser;
      await this.materialRequestService.deleteMaterialRequest(deleteForm, {
        empNo,
        empName,
      });
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
  async submitForm(@Body() formMasterId, @Req() request: Request) {
    try {
      const { masterId } = formMasterId;
      const queryApproveTemplate =
        await this.approveService.getApproveLogTemplate({
          masterId: masterId,
        });
      const { approveTemplate } = queryApproveTemplate;
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const submitResult =
        await this.materialRequestService.submitFormRequest(masterId);
      const { empNo, empName, bossEmpNo } = queryUser;
      if (submitResult.success) {
        await this.approveService.updateMaterialApprovedLog({
          masterId,
          rank: 0,
          reason: '送出申請單',
          status: 'APPROVED',
          updatedBy: empNo,
        });
        await this.approveService.createMaterialApprovedLog({
          masterId,
          approver: bossEmpNo,
          approveTemplate: approveTemplate,
          rank: 10,
          reason: '主管簽核',
          stageType: 'BOSS',
          status: 'WAIT_APPROVAL',
        });
        return {
          success: submitResult.success,
          message: submitResult.message,
        };
      } else {
        return {
          success: submitResult.success,
          message: submitResult.message,
        };
      }
    } catch (error) {
      throw new CustomHttpException('申請單送出發生錯誤', false);
    }
  }
  @Post('generate-semifinished-materials')
  async generateSemifinishedMaterials(
    @Query('materialId') materialId: string,
    @Req() request: Request,
  ) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const { empNo, empName } = queryUser;
      const generateResult =
        await this.materialRequestService.semifinishedMaterials({
          materialId,
          empName,
          empNo,
        });
      return {
        success: true,
        message: '中間料號產生成功',
        data: generateResult,
      };
    } catch (error) {
      throw new CustomHttpException('中間料號產生失敗', false);
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
  async currentUserIdentity(@Req() request: Request) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
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
  async departmentBossCheck(@Body() data, @Req() request: Request) {
    try {
      const { masterId, remarks } = data;
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const queryApproveTemplate =
        await this.approveService.getApproveLogTemplate({
          masterId: masterId,
        });
      const { approveTemplate, approver } = queryApproveTemplate;
      const { empNo, empName, isDepartmentBoss, getMaterialTeamMemberResult } =
        queryUser;
      const workerNumbers = getMaterialTeamMemberResult
        .map((item) => item.workerNumber)
        .join(', ');
      if (!isDepartmentBoss) {
        return {
          success: false,
          message: '非部門主管無法簽核',
        };
      }
      const approvedUpdateResult =
        await this.approveService.updateMaterialApprovedLog({
          masterId,
          rank: 10,
          reason: remarks,
          status: 'APPROVED',
          updatedBy: empNo,
        });
      if (approveTemplate === 'APPROVE_FLOW2') {
        const approvedCreateResult =
          await this.approveService.createMaterialApprovedLog({
            masterId,
            approver: approver,
            approveTemplate: approveTemplate,
            rank: 20,
            reason: '中間料號編輯',
            stageType: 'SEMI_EDIT',
            status: 'WAIT_APPROVAL',
          });
        return {
          success: true,
          message: '簽核成功',
        };
      } else {
        const approvedCreateResult =
          await this.approveService.createMaterialApprovedLog({
            masterId,
            approver: workerNumbers,
            approveTemplate: approveTemplate,
            rank: 20,
            reason: '料號小組簽核',
            stageType: 'MATERIAL_TEAM',
            status: 'WAIT_APPROVAL',
          });
        return {
          success: true,
          message: '簽核成功',
        };
      }
    } catch (error) {
      throw new CustomHttpException('單位主管簽核失敗', false);
    }
  }
  @Patch('material-team-check')
  @UseGuards(AuthGuard)
  async materialTeamCheck(@Body() data, @Req() request: Request) {
    try {
      const { masterId, remarks } = data;
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const queryApproveTemplate =
        await this.approveService.getApproveLogTemplate({
          masterId: masterId,
        });
      const { approveTemplate } = queryApproveTemplate;
      const { empNo, empName, isMaterialTeamMamber } = queryUser;
      if (!isMaterialTeamMamber) {
        return {
          success: false,
          message: '非料號小組成員無法簽核',
        };
      }
      const updateFormStatus = await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: 'A' },
      );
      await this.approveService.updateMaterialApprovedLog({
        masterId,
        rank: approveTemplate === 'APPROVE_FLOW1' ? 20 : 30,
        reason: '料號小組簽核',
        status: 'APPROVED',
        updatedBy: empNo,
      });
      return {
        success: true,
        message: '簽核成功',
      };
    } catch (error) {
      throw new CustomHttpException('料號小組簽核失敗', false);
    }
  }
  @Patch('department-boss-return')
  async departmentBossReturn(@Body() data, @Req() request: Request) {
    const { masterId, remarks } = data;
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const { empNo, empName, isDepartmentBoss } = queryUser;
      if (!isDepartmentBoss) {
        return {
          success: false,
          message: '非部門主管無法退簽',
        };
      }
      const queryApproveTemplate =
        await this.approveService.getApproveLogTemplate({
          masterId: masterId,
        });
      const { approveTemplate, approver } = queryApproveTemplate;
      const updateFormStatus = await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: 'N' },
      );
      const approvedUpdateResult =
        await this.approveService.updateMaterialApprovedLog({
          masterId,
          rank: 10,
          reason: remarks,
          status: 'REJECT',
          updatedBy: empNo,
        });
      const approvedCreateResult =
        await this.approveService.createMaterialApprovedLog({
          masterId,
          approver: approver,
          approveTemplate: approveTemplate,
          rank: 0,
          reason: '部門主管退簽',
          stageType: 'APPLICANT',
          status: 'WAIT_APPROVAL',
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
  async materialTeamReturn(@Body() data, @Req() request: Request) {
    const semiReturnStatus = data.semiReturn;
    const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
    const { masterId, remarks } = data;
    const queryUser = await this.userService.getUserIdentity({
      jwtCookie,
      retrunEmpNo: true,
    });
    const { empNo, empName, isMaterialTeamMamber } = queryUser;
    if (!isMaterialTeamMamber) {
      return {
        success: false,
        message: '非料號小組成員無法退簽',
      };
    }
    const queryApproveTemplate =
      await this.approveService.getApproveLogTemplate({
        masterId: masterId,
      });
    const { approveTemplate, approver } = queryApproveTemplate;
    if (semiReturnStatus) {
      //true:只退中間料號簽核流程
      try {
        await this.approveService.updateMaterialApprovedLog({
          masterId,
          rank: 30,
          reason: '料號小組退中間料號',
          status: 'REJECT',
          updatedBy: empNo,
        });
        const approvedCreateResult =
          await this.approveService.createMaterialApprovedLog({
            masterId,
            approver: approver,
            approveTemplate: approveTemplate,
            rank: 20,
            reason: '料號小組退中間料號',
            stageType: 'SEMI_EDIT',
            status: 'WAIT_APPROVAL',
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
        const queryApproveTemplate =
          await this.approveService.getApproveLogTemplate({
            masterId: masterId,
          });
        const { approveTemplate } = queryApproveTemplate;
        const updateFormStatus = await this.materialRequestFormMaster.update(
          { masterId: masterId },
          { statusCode: 'N' },
        );
        const approvedCreateResult =
          await this.approveService.updateMaterialApprovedLog({
            masterId,
            rank: approveTemplate === 'APPROVE_FLOW1' ? 20 : 30,
            reason: '料號小組退簽',
            status: 'REJECT',
            updatedBy: empNo,
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
  }
  @Patch('semifinished-material-check')
  async semifinishedMaterialCheck(@Body() data, @Req() request: Request) {
    try {
      const { masterId, remarks } = data;
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryUser = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      const { empNo, empName, getMaterialTeamMemberResult } = queryUser;
      const workerNumbers = getMaterialTeamMemberResult
        .map((item) => item.workerNumber)
        .join(',');
      const queryApproveTemplate =
        await this.approveService.getApproveLogTemplate({
          masterId: masterId,
        });
      const { approveTemplate } = queryApproveTemplate;
      await this.approveService.updateMaterialApprovedLog({
        masterId,
        rank: 20,
        reason: '中間料號編輯完成',
        status: 'APPROVED',
        updatedBy: empNo,
      });
      const approvedCreateResult =
        await this.approveService.createMaterialApprovedLog({
          masterId,
          approver: workerNumbers,
          approveTemplate: approveTemplate,
          rank: 30,
          reason: '料號小組簽核',
          stageType: 'MATERIAL_TEAM',
          status: 'WAIT_APPROVAL',
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
  async currentFormsOwner(@Req() request: Request) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
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
  @Get('pending-approve')
  async pendingApprove(@Req() request: Request) {
    try {
      const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
      const queryFormsOwner = await this.userService.getUserIdentity({
        jwtCookie,
        retrunEmpNo: true,
      });
      // const queryResult = await this.materialRequestService.getFormsOwner({
      //   queryFormsOwner,
      // });
      const {
        isDepartmentBoss,
        isMaterialTeamMamber,
        queryDeptEmpList,
        empNo,
      } = queryFormsOwner;
      const queryResult = await this.materialRequestService.getPendingForms({
        // formNo,
        isDepartmentBoss,
        isMaterialTeamMamber,
        queryDeptEmpList,
        empNo,
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
