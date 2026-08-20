import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Prefer EXPO_PUBLIC_API_URL; always fall back to Railway for device builds.
const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ||
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
    'AdminUser',
    'AdminOrder',
    'Analytics',
    'AuditLog',
    'InvoiceAdmin',
    'NotificationAdmin',
  ],
  endpoints: () => ({}),
});
