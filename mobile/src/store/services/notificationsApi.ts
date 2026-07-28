import { api } from './api';

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    notifications: builder.query<any, any>({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    markRead: builder.mutation<any, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllRead: builder.mutation<any, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} = notificationsApi;
