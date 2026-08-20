import { api } from './api';

export const adminNotificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminSendBroadcast: builder.mutation<
      any,
      { title: string; body: string; link?: string; data?: any }
    >({
      query: (body) => ({
        url: '/notifications/send',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NotificationAdmin'],
    }),
    adminNotificationHistory: builder.query<
      any,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/notifications/history',
        params: params || undefined,
      }),
      providesTags: ['NotificationAdmin'],
    }),
    adminDeleteNotification: builder.mutation<any, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['NotificationAdmin'],
    }),
    adminBulkDeleteNotifications: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: '/notifications/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['NotificationAdmin'],
    }),
  }),
});

export const {
  useAdminSendBroadcastMutation,
  useAdminNotificationHistoryQuery,
  useAdminDeleteNotificationMutation,
  useAdminBulkDeleteNotificationsMutation,
} = adminNotificationsApi;
