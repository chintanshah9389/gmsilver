import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { logout, setAuth } from '../slices/authSlice';
import {
  clearRememberedSession,
  loadRememberMe,
  persistLogin,
} from '@/lib/remember-me';

// Prefer EXPO_PUBLIC_API_URL; always fall back to Railway for device builds.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://charming-encouragement-production-dc0c.up.railway.app/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

function isAuthEndpoint(args: string | FetchArgs) {
  const url = typeof args === 'string' ? args : args.url;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/forgot') ||
    url.includes('/auth/reset')
  );
}

async function refreshAccessToken(api: {
  getState: () => unknown;
  dispatch: (action: unknown) => unknown;
}): Promise<boolean> {
  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;
  const user = state.auth.user;
  if (!refreshToken || !user) return false;

  const result = await rawBaseQuery(
    {
      url: '/auth/refresh',
      method: 'POST',
      body: { refreshToken },
    },
    api as any,
    {},
  );

  if (result.error) return false;

  const payload = (result.data as { data?: {
    accessToken?: string;
    refreshToken?: string;
  } })?.data;

  if (!payload?.accessToken || !payload?.refreshToken) return false;

  const session = {
    user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  api.dispatch(setAuth(session));

  try {
    const remembered = await loadRememberMe();
    if (remembered.enabled) {
      await persistLogin({
        remember: true,
        identifier: remembered.identifier || user.email,
        session,
      });
    }
  } catch {
    // ignore storage errors
  }

  return true;
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isAuthEndpoint(args)) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken(api).finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      try {
        await clearRememberedSession();
      } catch {
        // ignore
      }
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Category',
    'Product',
    'Wishlist',
    'Cart',
    'Order',
    'Notification',
    'Banner',
    'HomeWidget',
    'AdminUser',
    'AdminOrder',
    'InvoiceAdmin',
    'NotificationAdmin',
  ],
  endpoints: () => ({}),
});
