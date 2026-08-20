import { api } from './api';

export const adminAuditLogsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminAuditLogs: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: '/audit-logs', params: params || undefined }),
      providesTags: ['AuditLog'],
    }),
    adminAuditLogUsers: builder.query<any, void>({
      query: () => '/audit-logs/users',
      providesTags: ['AuditLog'],
    }),
    adminAuditLogSummary: builder.query<
      any,
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: '/audit-logs/summary',
        params: params || undefined,
      }),
      providesTags: ['AuditLog'],
    }),
    adminDeleteAuditLog: builder.mutation<any, string>({
      query: (id) => ({ url: `/audit-logs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AuditLog'],
    }),
    adminBulkDeleteAuditLogs: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: '/audit-logs/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useAdminAuditLogsQuery,
  useAdminAuditLogUsersQuery,
  useAdminAuditLogSummaryQuery,
  useAdminDeleteAuditLogMutation,
  useAdminBulkDeleteAuditLogsMutation,
} = adminAuditLogsApi;
