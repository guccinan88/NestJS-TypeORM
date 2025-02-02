import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AuthService } from 'src/service/auth/auth.service';

@Module({
  imports: [HttpModule],
  providers: [AuthService, AuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
