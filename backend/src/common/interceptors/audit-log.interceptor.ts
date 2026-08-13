import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { verify } from 'jsonwebtoken';
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
    private readonly configService: ConfigService,
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

    // Auth login/signup/logout are written in AuthService (guarantees userId).
    // Interceptor only records failed AUTH attempts here.
    if (
      auditMeta.module === 'AUTH' &&
      ['LOGIN', 'LOGIN_MPIN', 'SIGNUP', 'LOGOUT'].includes(auditMeta.action)
    ) {
      return next.handle().pipe(
        catchError((err) => {
          this.writeLog({
            userId: this.resolveUserId(request, null),
            action: `${auditMeta.action}_FAILED`,
            module: auditMeta.module,
            data: {
              method,
              url: path,
              body: this.sanitizeBody(request.body),
              statusCode: err?.status,
              message: err?.message,
            },
            ipAddress: extractClientIp(request),
            userAgent: request.headers['user-agent'],
            deviceDetails: null,
          });
          return throwError(() => err);
        }),
      );
    }

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
        this.writeLog({
          userId: this.resolveUserId(request, response),
          action: auditMeta.action,
          module: auditMeta.module,
          data: payload,
          ipAddress,
          userAgent,
          deviceDetails: request.user?.deviceDetails || null,
        });
      }),
    );
  }

  private resolveUserId(request: any, response: any): string | null {
    if (request.user?.id) {
      return request.user.id;
    }

    const fromResponse = extractUserIdFromResponse(response);
    if (fromResponse) {
      return fromResponse;
    }

    const authHeader = request.headers?.authorization;
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.slice(7);
      const secret = this.configService.get<string>('jwt.accessSecret');
      if (!secret) return null;
      const payload = verify(token, secret) as { sub?: string };
      return payload?.sub || null;
    } catch {
      return null;
    }
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
