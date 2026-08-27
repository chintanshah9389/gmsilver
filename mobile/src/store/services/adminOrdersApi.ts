import { api } from './api';

export const adminOrdersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminOrders: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: '/orders/all', params: params || undefined }),
      providesTags: (result) => {
        const rows: any[] = result?.data || [];
        return [
          { type: 'AdminOrder' as const, id: 'LIST' },
          ...rows.map((row) => ({ type: 'AdminOrder' as const, id: row.id })),
        ];
      },
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
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled, getState }) {
        const patches: Array<{ undo: () => void }> = [];
        const state = getState() as any;
        const cached = api.util.selectInvalidatedBy(state, [
          { type: 'AdminOrder', id: 'LIST' },
        ]);

        for (const entry of cached) {
          if (entry.endpointName !== 'adminOrders') continue;
          patches.push(
            dispatch(
              adminOrdersApi.util.updateQueryData(
                'adminOrders',
                entry.originalArgs,
                (draft: any) => {
                  const rows: any[] = draft?.data || [];
                  const row = rows.find((item) => item.id === id);
                  if (row) row.status = status;
                },
              ),
            ),
          );
        }

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AdminOrder', id: 'LIST' },
        { type: 'AdminOrder', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Order', id },
        'Analytics',
      ],
    }),
    adminDeleteOrder: builder.mutation<any, string>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminOrder', id: 'LIST' },
        { type: 'AdminOrder', id },
        { type: 'Order', id: 'LIST' },
        'Analytics',
      ],
    }),
    adminBulkDeleteOrders: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: '/orders/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['AdminOrder', 'Order', 'Analytics'],
    }),
  }),
});

export const {
  useAdminOrdersQuery,
  useAdminUpdateOrderStatusMutation,
  useAdminDeleteOrderMutation,
  useAdminBulkDeleteOrdersMutation,
} = adminOrdersApi;
