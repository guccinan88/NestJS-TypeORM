import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'node-rfc';

@Injectable()
export class SapService implements OnModuleDestroy {
  private client: Client;
  constructor(
    private readonly configService: ConfigService,
    private sapConnectionConfig: any,
  ) {
    this.client = new Client(sapConnectionConfig);
  }
  //start sap client
  async sapConnection(): Promise<void> {
    try {
      await this.client.open();
      console.log('Sap Connected!');
    } catch (error) {
      console.error(error);
    }
  }
  //call sap function
  async sapFunction(functionName: string, sapParams: any): Promise<any> {
    try {
      await this.sapConnection();
      const result = await this.client.call(functionName, sapParams);
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  //close sap client
  async sapCloseConnection(): Promise<void> {
    try {
      await this.client.close();
      console.log('Sap Connection Closed!');
    } catch (error) {
      console.error(error);
    }
  }
  async onModuleDestroy() {
    await this.sapCloseConnection();
  }
}
