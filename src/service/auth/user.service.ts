import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { DeptAll, EmpAll, MaterialRequestFormMaster } from 'src/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomHttpException } from 'src/filters/http-exception/http-exception.filter';
import { ApproveService } from '../approve/approve.service';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DeptAll, 'msEmp')
    private readonly deptRepository: Repository<DeptAll>,
    @InjectRepository(EmpAll, 'msEmp')
    private readonly empRepository: Repository<EmpAll>,
    @InjectRepository(MaterialRequestFormMaster, 'msConnection')
    private readonly materialRequestFormMaster: Repository<MaterialRequestFormMaster>,
    private readonly approveService: ApproveService,
  ) {}

  async getJwtVerify({ jwtCookie }) {
    const jwksUrl = this.configService.get<string>('JWT_PUBLIC_KEY');
    const jwtKey = await axios.get(jwksUrl);
    if (jwtKey.status === 200) {
      const jwtDecode = await jwt.verify(jwtCookie, jwtKey.data);
      return jwtDecode;
    } else {
      return {
        status: false,
        message: '使用者驗證發生錯誤',
      };
    }
  }
  async getUserIdentity({ jwtCookie, retrunEmpNo = false }) {
    const jwksUrl = this.configService.get<string>('JWT_PUBLIC_KEY');
    const jwtKey = await axios.get(jwksUrl);
    if (jwtKey.status === 200 && jwtCookie) {
      try {
        const jwtDecode = await jwt.verify(jwtCookie, jwtKey.data);
        //取得登入者詳細資料
        const queryUserResult = await this.empRepository.find({
          select: ['empNo', 'empName'],
          where: {
            empNo: (jwtDecode as any).workerNumber, //測試時候把這裡改成料號小組或單位主管工號
          },
          relations: ['dept'], //關聯同個部門
        });
        if (queryUserResult.length <= 0) {
          return {
            status: false,
            message: '找不到使用者工號',
          };
        }
        const [
          {
            empNo,
            empName,
            dept: { deptCode, deptName, bossEmpNo },
          },
        ] = queryUserResult;
        //查詢出部門人員清單
        const queryDeptEmpList = await this.empRepository.find({
          select: ['empNo'],
          where: {
            dept: {
              deptCode,
            },
          },
        });
        //工號與bossEmpNo相等代表登入者是主管
        const isDepartmentBoss = empNo === bossEmpNo || false;
        const getMaterialTeamMemberUrl = this.configService.get<string>(
          'GET_MATERIAL_TEAM_MEMBER',
        );
        //取得物料小組角色成員清單
        const getMaterialTeamMemberResult = await axios
          .get(getMaterialTeamMemberUrl)
          .then((item) => item.data);
        //如果工號符合代表登入的是料號小組
        const isMaterialTeamMamber = getMaterialTeamMemberResult.some(
          (item) => item.workerNumber === empNo,
        );
        return retrunEmpNo
          ? {
              empNo,
              isDepartmentBoss,
              isMaterialTeamMamber,
              queryDeptEmpList,
              empName,
              bossEmpNo,
              getMaterialTeamMemberResult,
            }
          : {
              isDepartmentBoss,
              isMaterialTeamMamber,
            };
      } catch (error) {
        throw new CustomHttpException('取得身分失敗', false);
      }
    } else {
      return {
        status: false,
        message: jwtCookie ? '使用者驗證失敗' : '使用者未登入，Not Cookie',
      };
    }
  }
  // async signatureForm({ data, statusCode, empName, empNo }) {
  //   const { masterId, remarks } = data;
  //   if (statusCode === 'P') {
  //     // await this.materialRequestFormMaster.update(
  //     //   { masterId: masterId },
  //     //   { statusCode: statusCode },
  //     // );
  //     const approvedResult =
  //       await this.approveService.createMaterialApprovedLog({
  //         masterId,
  //         approver: empNo,
  //         approveTemplate: 'APPROVE_FLOW2',
  //         rank: 20,
  //         reason: '自動產生中間料號',
  //         stageType: 'SEMI_EDIT',
  //         status: 'WAIT_APPROVAL',
  //       });
  //     console.log(approvedResult);
  //   } else if (statusCode === 'A') {
  //     const updateFormStatus = await this.materialRequestFormMaster.update(
  //       { masterId: masterId },
  //       { statusCode: statusCode },
  //     );
  //     await this.approveService.createMaterialApprovedLog({
  //       masterId,
  //       approver: empNo,
  //       approveTemplate: 'APPROVE_FLOW2',
  //       rank: 30,
  //       reason: '料號小組簽核',
  //       stageType: 'MATERIAL_TEAM',
  //       status: 'APPROVED',
  //     });
  //     return updateFormStatus.affected;
  //   }
  //   // else if (statusCode === 'V') {
  //   //   const updateFormStatus = await this.materialRequestFormMaster.update(
  //   //     { masterId: masterId },
  //   //     { statusCode: statusCode },
  //   //   );
  //   //   const approvedResult =
  //   //     await this.approveService.createMaterialApprovedLog({
  //   //       masterId,
  //   //       approver: empNo,
  //   //       approveTemplate: 'APPROVE_FLOW2',
  //   //       rank: 30,
  //   //       reason: '料號小組簽核',
  //   //       stageType: 'MATERIAL_TEAM',
  //   //       status: 'WAIT_APPROVAL',
  //   //     });
  //   //   console.log(approvedResult);
  //   // }
  //   else if (statusCode === 'N') {
  //     const updateFormStatus = await this.materialRequestFormMaster.update(
  //       { masterId: masterId },
  //       { statusCode: statusCode },
  //     );
  //     const approvedResult =
  //       await this.approveService.createMaterialApprovedLog({
  //         masterId,
  //         approver: empNo,
  //         approveTemplate: 'APPROVE_FLOW2',
  //         rank: 0,
  //         reason: '退簽',
  //         stageType: 'APPLICANT',
  //         status: 'WAIT_APPROVAL',
  //       });
  //     console.log(approvedResult);
  //     //將過去的簽核紀錄都標示finish
  //     // await this.approveService.returnMaterialApprovedLog({
  //     //   masterId,
  //     // });
  //     // await this.approveService.createMaterialApprovedLog({
  //     //   masterId,
  //     //   userId: empNo,
  //     //   userName: empName,
  //     //   statusCode,
  //     //   manualReason: remarks,
  //     // });
  //     // return updateFormStatus.affected;
  //   } else if (statusCode === 'M') {
  //     // const updateFormStatus = await this.materialRequestFormMaster.update(
  //     //   { masterId: masterId },
  //     //   { statusCode: statusCode },
  //     // );
  //     const approvedResult =
  //       await this.approveService.createMaterialApprovedLog({
  //         masterId,
  //         approver: empNo,
  //         approveTemplate: 'APPROVE_FLOW2',
  //         rank: 20,
  //         reason: '中間料號編輯完成',
  //         stageType: 'SEMI_EDIT',
  //         status: 'APPROVED',
  //       });
  //     console.log(approvedResult);
  //   } else if (statusCode === 'B') {
  //     // const updateFormStatus = await this.materialRequestFormMaster.update(
  //     //   { masterId: masterId },
  //     //   { statusCode: statusCode },
  //     // );
  //     const approvedResult =
  //       await this.approveService.updateMaterialApprovedLog({
  //         masterId,
  //         reason: '部門主管簽核',
  //         status: 'APPROVED',
  //       });
  //     await this.approveService.createMaterialApprovedLog({
  //       masterId,
  //       approver: empNo,
  //       approveTemplate: 'APPROVE_FLOW2',
  //       rank: 30,
  //       reason: '料號小組簽核',
  //       stageType: 'MATERIAL_TEAM',
  //       status: 'WAIT_APPROVAL',
  //     });
  //     console.log(approvedResult);
  //     // return updateFormStatus.affected;
  //   }
  // }
}
