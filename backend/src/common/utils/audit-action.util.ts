type AuditMeta = { action: string; module: string };

const SKIP_GET_PREFIXES = [
  '/audit-logs',
  '/analytics',
  '/storage',
  '/home-widgets',
];

function firstSegment(path: string): string {
  return path.split('/').filter(Boolean)[0] || 'APP';
}

function moduleFromPath(path: string): string {
  const segment = firstSegment(path).replace(/-/g, '_');
  return segment.toUpperCase();
}

export function normalizeRequestPath(url?: string): string {
  let raw = String(url || '').split('?')[0].trim();
  raw = raw.replace(/^https?:\/\/[^/]+/i, '');
  if (!raw.startsWith('/')) {
    raw = `/${raw}`;
  }
  raw = raw.replace(/^\/api\/v\d+/, '');
  return raw.replace(/\/+$/, '') || '/';
}

export function resolveAuditMeta(
  method: string,
  path: string,
): AuditMeta | null {
  const m = (method || 'GET').toUpperCase();
  const p = path.replace(/\/+$/, '') || '/';

  if (m === 'OPTIONS' || m === 'HEAD') {
    return null;
  }

  if (
    p === '/auth/me' ||
    p === '/auth/refresh' ||
    p === '/auth/security-questions' ||
    p.endsWith('/fcm-token')
  ) {
    return null;
  }

  if (m === 'GET') {
    if (SKIP_GET_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
      return null;
    }
    if (p === '/auth/me') return null;
    if (p === '/notifications' || /^\/notifications\/[^/]+$/.test(p)) {
      return null;
    }
    if (p === '/products') return null;
    if (p === '/categories' || p === '/banners') return null;
    if (p === '/cart' || p === '/wishlist') return null;
    if (p === '/orders' || p === '/orders/all' || p === '/invoices') {
      return null;
    }
    if (p === '/users' || p === '/users/profile') return null;
  }

  if (p === '/auth/login') return { action: 'LOGIN', module: 'AUTH' };
  if (p === '/auth/login/mpin') return { action: 'LOGIN_MPIN', module: 'AUTH' };
  if (p === '/auth/signup') return { action: 'SIGNUP', module: 'AUTH' };
  if (p === '/auth/logout') return { action: 'LOGOUT', module: 'AUTH' };
  if (p === '/auth/mpin/create') return { action: 'CREATE_MPIN', module: 'AUTH' };
  if (p === '/auth/password/forgot') return { action: 'FORGOT_PASSWORD', module: 'AUTH' };
  if (p === '/auth/password/reset') return { action: 'RESET_PASSWORD', module: 'AUTH' };
  if (p === '/auth/password/change') return { action: 'CHANGE_PASSWORD', module: 'AUTH' };
  if (p === '/auth/mpin/forgot') return { action: 'FORGOT_MPIN', module: 'AUTH' };
  if (p === '/auth/mpin/reset') return { action: 'RESET_MPIN', module: 'AUTH' };
  if (p === '/auth/mpin/reset-with-password') {
    return { action: 'RESET_MPIN_WITH_PASSWORD', module: 'AUTH' };
  }
  if (p === '/auth/mpin/change') return { action: 'CHANGE_MPIN', module: 'AUTH' };
  if (p === '/auth/security-question') {
    return { action: 'LOOKUP_SECURITY_QUESTION', module: 'AUTH' };
  }
  if (p === '/auth/reset-with-security-question') {
    return { action: 'RESET_WITH_SECURITY_QUESTION', module: 'AUTH' };
  }

  if (m === 'GET' && p === '/products/search') {
    return { action: 'SEARCH', module: 'PRODUCT' };
  }
  if (m === 'GET' && /^\/products\/[^/]+$/.test(p)) {
    return { action: 'PRODUCT_VIEW', module: 'PRODUCT' };
  }
  if (m === 'POST' && p === '/products') {
    return { action: 'CREATE_PRODUCT', module: 'PRODUCT' };
  }
  if (m === 'PUT' && /^\/products\/[^/]+$/.test(p)) {
    return { action: 'UPDATE_PRODUCT', module: 'PRODUCT' };
  }
  if (m === 'DELETE' && p === '/products/bulk') {
    return { action: 'BULK_DELETE_PRODUCTS', module: 'PRODUCT' };
  }
  if (m === 'DELETE' && /^\/products\/[^/]+$/.test(p)) {
    return { action: 'DELETE_PRODUCT', module: 'PRODUCT' };
  }

  if (m === 'POST' && p === '/cart/items') {
    return { action: 'ADD_TO_CART', module: 'CART' };
  }
  if (m === 'PUT' && /^\/cart\/items\/[^/]+$/.test(p)) {
    return { action: 'UPDATE_CART', module: 'CART' };
  }
  if (m === 'DELETE' && /^\/cart\/items\/[^/]+$/.test(p)) {
    return { action: 'REMOVE_FROM_CART', module: 'CART' };
  }
  if (m === 'DELETE' && p === '/cart') {
    return { action: 'CLEAR_CART', module: 'CART' };
  }

  if (m === 'POST' && /^\/wishlist\/[^/]+$/.test(p)) {
    return { action: 'ADD_TO_WISHLIST', module: 'WISHLIST' };
  }
  if (m === 'DELETE' && /^\/wishlist\/[^/]+$/.test(p)) {
    return { action: 'REMOVE_FROM_WISHLIST', module: 'WISHLIST' };
  }

  if (m === 'POST' && p === '/orders') {
    return { action: 'CREATE_ORDER', module: 'ORDER' };
  }
  if (m === 'GET' && /^\/orders\/[^/]+$/.test(p) && p !== '/orders/all') {
    return { action: 'ORDER_VIEW', module: 'ORDER' };
  }
  if (m === 'PATCH' && /^\/orders\/[^/]+\/status$/.test(p)) {
    return { action: 'UPDATE_ORDER_STATUS', module: 'ORDER' };
  }
  if (m === 'PATCH' && /^\/orders\/[^/]+\/cancel$/.test(p)) {
    return { action: 'CANCEL_ORDER', module: 'ORDER' };
  }
  if (m === 'DELETE' && p === '/orders/bulk') {
    return { action: 'BULK_DELETE_ORDERS', module: 'ORDER' };
  }
  if (m === 'DELETE' && /^\/orders\/[^/]+$/.test(p)) {
    return { action: 'DELETE_ORDER', module: 'ORDER' };
  }

  if (m === 'POST' && /^\/invoices\/generate\/[^/]+$/.test(p)) {
    return { action: 'GENERATE_INVOICE', module: 'INVOICE' };
  }
  if (m === 'GET' && /^\/invoices\/order\/[^/]+$/.test(p)) {
    return { action: 'INVOICE_VIEW', module: 'INVOICE' };
  }

  if (m === 'POST' && p === '/users') {
    return { action: 'CREATE_USER', module: 'USER' };
  }
  if (m === 'PATCH' && p === '/users/profile') {
    return { action: 'UPDATE_PROFILE', module: 'USER' };
  }
  if (m === 'PATCH' && /^\/users\/[^/]+\/status$/.test(p)) {
    return { action: 'UPDATE_USER_STATUS', module: 'USER' };
  }
  if (m === 'PATCH' && /^\/users\/[^/]+\/credentials$/.test(p)) {
    return { action: 'UPDATE_USER_CREDENTIALS', module: 'USER' };
  }
  if (m === 'DELETE' && /^\/users\/[^/]+$/.test(p)) {
    return { action: 'DELETE_USER', module: 'USER' };
  }

  if (m === 'POST' && p === '/notifications/send') {
    return { action: 'SEND_NOTIFICATION', module: 'NOTIFICATION' };
  }
  if (m === 'PATCH' && p === '/notifications/read-all') {
    return { action: 'MARK_ALL_NOTIFICATIONS_READ', module: 'NOTIFICATION' };
  }
  if (m === 'PATCH' && /^\/notifications\/[^/]+\/read$/.test(p)) {
    return { action: 'MARK_NOTIFICATION_READ', module: 'NOTIFICATION' };
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) {
    return {
      action: `${m}_${moduleFromPath(p)}`,
      module: moduleFromPath(p),
    };
  }

  if (m === 'GET' && (p === '/excel' || p.startsWith('/excel/'))) {
    return null;
  }

  return null;
}

export function extractUserIdFromResponse(response: any): string | null {
  const payload = response?.data ?? response;
  return (
    payload?.user?.id ||
    payload?.id ||
    payload?.data?.user?.id ||
    payload?.data?.id ||
    null
  );
}

export function extractClientIp(request: any): string | null {
  const forwarded = request?.headers?.['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip =
    forwardedValue?.split(',')[0]?.trim() ||
    request?.ip ||
    request?.socket?.remoteAddress ||
    null;
  return ip || null;
}
