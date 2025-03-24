import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, map, Observable, of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  materialPermissionCheck({ jwtCookie }): Observable<any> {
    const PERMISSION_CODE = this.configService.get<string>('PERMISSION_CODE');
    const PERMISSION_CODE_CHECK_API = `${this.configService.get<string>(
      'PERMISSION_CODE_CHECK',
    )}accessToken=${jwtCookie}`;
    return this.httpService.get(PERMISSION_CODE_CHECK_API).pipe(
      map((response) => {
        console.log(response);
        return response;
      }),
      catchError((error) => {
        return of({
          status: error.response.status,
          message: error.message,
        });
      }),
    );
  }
}
