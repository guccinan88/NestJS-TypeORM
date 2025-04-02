import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MaterialApprovedLog,
  MaterialApprovedLogNew,
  MaterialApproveFlow,
  MaterialApproveFlowNew,
  MaterialRequestFormMaster,
  EmpAll,
} from 'src/entities';
import { CustomHttpException } from 'src/filters/http-exception/http-exception.filter';
import { IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class ApproveService {
  constructor(
    @InjectRepository(MaterialApprovedLogNew, 'msConnection')
    private readonly materialApprovedLogRepository: Repository<MaterialApprovedLogNew>,
    @InjectRepository(MaterialApproveFlowNew, 'msConnection')
    private readonly materialApproveFlow: Repository<MaterialApproveFlowNew>,
    @InjectRepository(MaterialRequestFormMaster, 'msConnection')
    private readonly materialRequestFormMaster: Repository<MaterialRequestFormMaster>,
    @InjectRepository(EmpAll, 'msEmp')
    private readonly empAll: Repository<EmpAll>,
  ) {}

  async createMaterialApprovedLog(data: MaterialApprovedLogNew) {
    try {
      const {
        masterId,
        stageType,
        approver,
        rank,
        reason = null,
        status,
        approveTemplate,
      } = data;
      const materialApprovedLog = new MaterialApprovedLogNew();
      materialApprovedLog.masterId = masterId;
      materialApprovedLog.approver = approver;
      materialApprovedLog.stageType = stageType;
      materialApprovedLog.reason = reason;
      materialApprovedLog.status = status;
      (materialApprovedLog.approveTemplate = approveTemplate),
        (materialApprovedLog.rank = rank);
      await this.materialApprovedLogRepository.save(materialApprovedLog);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException(`簽核流程發生錯誤`, false);
    }
    //   const queryMasterFormStatus =
    //     await this.materialRequestFormMaster.findOne({
    //       where: {
    //         masterId: masterId,
    //       },
    //     });
    //   const currentFormStatus = queryMasterFormStatus?.statusCode;
    //   const querymaterialApproveFlow = await this.materialApproveFlow.find({
    //     where: {
    //       approveTemplate: 'APPROVE_FORM',
    //       rank: 8,
    //     },
    //   });
    //   const convertApproveCondition =
    //     querymaterialApproveFlow?.[0]?.convertApproveCondition;
    //   const convertApproveConditionToSplit =
    //     convertApproveCondition?.split(',');
    //   console.log(querymaterialApproveFlow);
  }
  //必須切換有中間料號及無中間料號的簽核流程
  async getMaterialApprovedLog(masterId) {
    try {
      const queryApprovedStatus = await this.materialApprovedLogRepository.find(
        {
          select: [
            'masterId',
            'approver',
            'createdAt',
            'updatedBy',
            'updatedAt',
            'status',
            'stageType',
            'reason',
          ],
          where: {
            masterId: masterId,
          },
        },
      );

      const updatedRecords = await Promise.all(
        queryApprovedStatus.map(async (record) => {
          // 查詢 approver的姓名
          const approvers = await Promise.all(
            //待辦人有多個使用split分割
            record.approver.split(',').map(async (workerNumber) => {
              const worker = await this.empAll.findOne({
                where: { empNo: workerNumber },
              });
              return {
                empNo: workerNumber,
                empName: worker ? worker.empName : '測試帳號', // 如果找不到姓名，先塞測試帳號
              };
            }),
          );

          // 查詢 updatedBy 的姓名
          const updatedByName = await this.empAll
            .findOne({ where: { empNo: record.updatedBy } })
            .then((worker) => ({
              empNo: record.updatedBy,
              empName: worker ? worker.empName : '測試帳號',
            }));

          // 返回處理後的資料，並新增 approvedName 和 updatedName 欄位
          return {
            ...record,
            approver: approvers, // 用逗號分隔 approver 的姓名
            updatedBy: updatedByName,
          };
        }),
      );
      return updatedRecords;
    } catch (error) {
      throw new CustomHttpException(`簽核流程發生錯誤`, false);
    }
  }
  // async returnMaterialApprovedLog(masterId) {
  //   try {
  //     await this.materialApprovedLogRepository.update(masterId, {
  //       isFinish: 'Y',
  //     });
  //   } catch (error) {
  //     throw new CustomHttpException(`迴轉簽核歷程發生錯誤`, false);
  //   }
  // }

  async updateMaterialApprovedLog(data: MaterialApprovedLogNew) {
    const { masterId, reason = null, status, rank, updatedBy } = data;
    try {
      const latestRecord = await this.materialApprovedLogRepository.findOne({
        where: {
          masterId: masterId,
          rank: rank,
        },
        order: {
          createdAt: 'DESC', // 根據更新時間排序，'DESC' 代表降序，最新的會排在最前面
        },
      });

      if (latestRecord) {
        latestRecord.status = status;
        latestRecord.updatedAt = new Date();
        latestRecord.reason = reason;
        latestRecord.updatedBy = updatedBy;
        await this.materialApprovedLogRepository.save(latestRecord);
      }

      // await this.materialApprovedLogRepository.update(
      //   {
      //     masterId: masterId,
      //     rank: rank,
      //   },
      //   {
      //     status: status,
      //     updatedAt: new Date().toLocaleString('zh-TW', {
      //       timeZone: 'Asia/Taipei',
      //       hour12: false,
      //     }),
      //     reason: reason,
      //   },
      // );
    } catch (error) {
      throw new CustomHttpException(`更新簽核紀錄發生錯誤`, false);
    }
  }
  async getApproveLogTemplate({ masterId }) {
    const queryApproveTemplate =
      await this.materialApprovedLogRepository.findOne({
        select: ['approveTemplate', 'approver'],
        where: {
          masterId: masterId,
          rank: 0,
        },
      });
    return queryApproveTemplate;
  }
  async getFlowTemplate({ templateName }) {}
}
