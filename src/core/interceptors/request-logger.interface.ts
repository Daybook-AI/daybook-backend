
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RequestLoggerInterceptor.name);

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();

        const { method, originalUrl, body, query, params } = request;

        this.logger.log(
            JSON.stringify(
                {
                    method,
                    url: originalUrl,
                    params,
                    query,
                    body,
                },
                null,
                2,
            ),
        );

        return next.handle();
    }
}
