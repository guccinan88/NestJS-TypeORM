import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SapService } from 'src/service/material-request/sap-rfc.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SapService,
      useFactory: async (configService: ConfigService) => {
        const sapConnectionConfig = {
          user: configService.get<string>('SAP_LOGIN_USER'),
          passwd: configService.get<string>('SAP_LOGIN_PASSWORD'),
          ashost: configService.get<string>('SAP_HOST'),
          sysnr: configService.get<string>('SAP_NR'),
          client: configService.get<string>('SAP_CLIENT'),
          lang: configService.get<string>('SAP_LANG'),
        };
        return new SapService(configService, sapConnectionConfig);
      },
      inject: [ConfigService],
    },
  ],
  exports: [SapService],
})
export class SapServiceModule {}
