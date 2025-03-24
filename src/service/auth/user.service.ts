import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { DeptAll, EmpAll, MaterialRequestFormMaster } from 'src/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomHttpException } from 'src/filters/http-exception/http-exception.filter';

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
            empNo: (jwtDecode as any).workerNumber,
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
  async signatureForm({ request, statusCode }) {
    const { masterId, remarks } = request;
    if (statusCode === 'P') {
      await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: statusCode },
      );
    } else if (statusCode === 'A') {
      const updateFormStatus = await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: statusCode, deptBossRemarks: remarks },
      );
      return updateFormStatus.affected;
    } else if (statusCode === 'V') {
      const updateFormStatus = await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: statusCode, materialTeamRemarks: remarks },
      );
      return updateFormStatus.affected;
    } else if (statusCode === 'N') {
      const updateFormStatus = await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: statusCode, returnRemarks: remarks },
      );
      return updateFormStatus.affected;
    } else if (statusCode === 'M') {
      const updateFormStatus = await this.materialRequestFormMaster.update(
        { masterId: masterId },
        { statusCode: statusCode },
      );
      return updateFormStatus.affected;
    }
  }
}
