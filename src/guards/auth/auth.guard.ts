import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from 'src/service/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  canActivate(context: ExecutionContext): Observable<boolean> | boolean {
    //獲取當前請求的詳細訊息，這方式通常用在Guard或Interceptor
    const request = context.switchToHttp().getRequest();
    const jwtCookie = request.cookies['__MOONSCAPE_ACCESS_TOKEN'];
    //如果Cookie沒有JWT拒絕進入
    if (!jwtCookie) return false;

    return this.authService.materialPermissionCheck({ jwtCookie }).pipe(
      map((response) => {
        return response;
      }),
      catchError(() => {
        return of(false);
      }),
    );
  }
}
