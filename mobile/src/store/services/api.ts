import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const envApiUrl =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.EXPO_PUBLIC_API_URL;

const baseUrl =
  envApiUrl ||
  'https://gmsilver-production.up.railway.app/api/v1';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
  ],
  endpoints: () => ({}),
});
