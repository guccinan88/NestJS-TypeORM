import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MaterialRequestModule } from './module/material-request/material-request.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SapServiceModule } from './module/material-request/sap-rfc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    MaterialRequestModule,
    TypeOrmModule.forRootAsync({
      name: 'msConnection',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mssql',
        port: Number(configService.get('DB_PORT')),
        host: configService.get<string>('DB_HOST'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'pgConnection',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        port: Number(configService.get('PG_PORT')),
        host: configService.get<string>('PG_HOST'),
        username: configService.get<string>('PG_USER'),
        password: configService.get<string>('PG_PASSWORD'),
        database: configService.get<string>('PG_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    SapServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AuthModule],
})
export class AppModule {}
