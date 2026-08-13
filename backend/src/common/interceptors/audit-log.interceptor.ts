import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';
import { AUDIT_LOG_KEY } from '../decorators/audit-log.decorator';
import {
  extractClientIp,
  extractUserIdFromResponse,
  normalizeRequestPath,
  resolveAuditMeta,
} from '../utils/audit-action.util';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = normalizeRequestPath(request.originalUrl || request.url);

    const decorated = this.reflector.get<{ action: string; module: string }>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );
    const auditMeta = decorated || resolveAuditMeta(method, path);

    if (!auditMeta) {
      return next.handle();
    }

    const user = request.user;
    const ipAddress = extractClientIp(request);
    const userAgent = request.headers['user-agent'];

    const payload = {
      method,
      url: path,
      params: request.params,
      query: this.sanitizeBody(request.query),
      body: this.sanitizeBody(request.body),
    };

    return next.handle().pipe(
      tap((response) => {
        const userId = user?.id || extractUserIdFromResponse(response) || null;
        this.writeLog({
          userId,
          action: auditMeta.action,
          module: auditMeta.module,
          data: payload,
          ipAddress,
          userAgent,
          deviceDetails: user?.deviceDetails || null,
        });
      }),
      catchError((err) => {
        if (
          auditMeta.module === 'AUTH' &&
          ['LOGIN', 'LOGIN_MPIN', 'SIGNUP'].includes(auditMeta.action)
        ) {
          this.writeLog({
            userId: user?.id || null,
            action: `${auditMeta.action}_FAILED`,
            module: auditMeta.module,
            data: {
              ...payload,
              statusCode: err?.status,
              message: err?.message,
            },
            ipAddress,
            userAgent,
            deviceDetails: user?.deviceDetails || null,
          });
        }
        return throwError(() => err);
      }),
    );
  }

  private writeLog(dto: {
    userId: string | null;
    action: string;
    module: string;
    data: any;
    ipAddress: string | null;
    userAgent?: string;
    deviceDetails: any;
  }) {
    this.auditLogsService.create(dto).catch((err) => console.error('Audit log error:', err));
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return body || null;
    }

    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.mpin;
    delete sanitized.confirmPassword;
    delete sanitized.confirmMpin;
    delete sanitized.newPassword;
    delete sanitized.oldPassword;
    delete sanitized.currentPassword;
    delete sanitized.refreshToken;
    delete sanitized.securityAnswer;
    return sanitized;
  }
}
