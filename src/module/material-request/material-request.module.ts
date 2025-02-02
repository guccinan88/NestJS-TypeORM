import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialRequestController } from 'src/controllers/material-request/material-request.controller';
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
} from 'src/entities';
import { DataSourceService } from 'src/service/database/data-source';
import { MaterialRequestService } from 'src/service/material-request/material-request.service';
import { SapServiceModule } from './sap-rfc.module';

@Module({
  imports: [
    SapServiceModule,
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
    TypeOrmModule.forFeature(
      [FccDrawingCode, TemDrawingCode, ComponentCode],
      'pgConnection',
    ),
  ],
  providers: [MaterialRequestService, DataSourceService],
  controllers: [MaterialRequestController],
})
export class MaterialRequestModule {}
