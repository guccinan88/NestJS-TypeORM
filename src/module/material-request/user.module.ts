import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DeptAll,
  EmpAll,
  MaterialApprovedLog,
  MaterialApprovedLogNew,
  MaterialApproveFlow,
  MaterialApproveFlowNew,
  MaterialAutomap,
  MaterialLovData,
  MaterialRequestCatalog,
  MaterialRequestFormItems,
  MaterialRequestFormMaster,
  MaterialRequestItemsUom,
  MaterialRequestPlant,
  MaterialRule,
  MaterialTemplate,
} from 'src/entities';
import { ApproveService } from 'src/service/approve/approve.service';
import { UserService } from 'src/service/auth/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeptAll, EmpAll], 'msEmp'),
    TypeOrmModule.forFeature(
      [
        MaterialTemplate,
        MaterialRule,
        MaterialLovData,
        MaterialRequestFormMaster,
        MaterialRequestFormItems,
        MaterialRequestCatalog,
        MaterialRequestPlant,
        MaterialRequestItemsUom,
        MaterialAutomap,
        MaterialApprovedLog,
        MaterialApproveFlow,
        MaterialApproveFlowNew,
        MaterialApprovedLogNew,
      ],
      'msConnection',
    ),
  ],
  providers: [UserService, ApproveService],
  exports: [UserService],
  controllers: [],
})
export class UserModule {}
