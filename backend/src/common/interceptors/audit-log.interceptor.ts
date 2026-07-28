import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';
import { AUDIT_LOG_KEY } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMeta = this.reflector.get<{ action: string; module: string }>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress =
      request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(() => {
        this.auditLogsService
          .create({
            userId: user?.id || null,
            action: auditMeta.action,
            module: auditMeta.module,
            data: {
              method: request.method,
              url: request.url,
              params: request.params,
              body: this.sanitizeBody(request.body),
            },
            ipAddress,
            userAgent,
            deviceDetails: user?.deviceDetails || null,
          })
          .catch((err) => console.error('Audit log error:', err));
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.mpin;
    delete sanitized.confirmPassword;
    delete sanitized.newPassword;
    return sanitized;
  }
}
