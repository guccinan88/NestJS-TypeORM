import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class DataSourceService {
  private mssqlDataSource: DataSource;
  constructor(private readonly configService: ConfigService) {
    this.mssqlDataSource = new DataSource({
      type: 'mssql',
      host: this.configService.get<string>('DB_HOST'),
      port: Number(this.configService.get<number>('DB_PORT')),
      username: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });
    this.mssqlDataSource
      .initialize()
      .then(() => console.log(''))
      .catch((err) => console.error(err));
  }

  async queryMaterialRequestCurrentSequence() {
    const queryResult = this.mssqlDataSource.query(
      'SELECT NEXT VALUE FOR MaterialRequestSequence AS CurrentValue',
    );
    return queryResult;
  }

  async queryMaterialIdCurrentSequence() {
    return await this.mssqlDataSource.query(
      'SELECT NEXT VALUE FOR MaterialIdSequence AS CurrentValue',
    );
  }
}
