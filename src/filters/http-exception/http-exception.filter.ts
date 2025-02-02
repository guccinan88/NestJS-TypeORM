import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomHttpException extends HttpException {
  constructor(
    private readonly errorMessage: string,
    private readonly success: boolean,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        success: success,
        message: errorMessage,
      },
      statusCode,
    );
  }
}
