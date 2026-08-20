import { api } from './api';

export const adminOrdersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminOrders: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: '/orders/all', params: params || undefined }),
      providesTags: ['AdminOrder'],
    }),
    adminUpdateOrderStatus: builder.mutation<
      any,
      { id: string; status: string; reason?: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status, reason },
      }),
      invalidatesTags: ['AdminOrder', 'Order'],
    }),
    adminDeleteOrder: builder.mutation<any, string>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminOrder'],
    }),
    adminBulkDeleteOrders: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: '/orders/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['AdminOrder'],
    }),
  }),
});

export const {
  useAdminOrdersQuery,
  useAdminUpdateOrderStatusMutation,
  useAdminDeleteOrderMutation,
  useAdminBulkDeleteOrdersMutation,
} = adminOrdersApi;
