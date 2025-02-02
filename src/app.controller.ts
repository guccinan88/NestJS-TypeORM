import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SapService } from './service/material-request/sap-rfc.service';

// @UseGuards(AuthGuard)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sapService: SapService,
  ) {}
  @Get('/health')
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('/sap-health')
  async getSapHealth(): Promise<string> {
    const result = await this.sapService.sapFunction('STFC_CONNECTION', {});
    return result.RESPTEXT;
  }
}
