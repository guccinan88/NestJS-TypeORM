import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DeptAll,
  EmpAll,
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
      ],
      'msConnection',
    ),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [],
})
export class UserModule {}
