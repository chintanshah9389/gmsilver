import { api } from './api';

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myOrders: builder.query<any, any>({
      query: (params) => ({ url: '/orders', params }),
      providesTags: (result) => {
        const rows: any[] = result?.data || [];
        return [
          { type: 'Order' as const, id: 'LIST' },
          ...rows.map((row) => ({ type: 'Order' as const, id: row.id })),
        ];
      },
    }),
    orderById: builder.query<any, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation<any, { notes?: string }>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Order', id: 'LIST' },
        'Cart',
      ],
    }),
    cancelOrder: builder.mutation<any, string>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'PATCH' }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const patches: Array<{ undo: () => void }> = [];
        const state = getState() as any;
        const cached = api.util.selectInvalidatedBy(state, [
          { type: 'Order', id: 'LIST' },
        ]);

        for (const entry of cached) {
          if (entry.endpointName !== 'myOrders') continue;
          patches.push(
            dispatch(
              ordersApi.util.updateQueryData(
                'myOrders',
                entry.originalArgs,
                (draft: any) => {
                  const rows: any[] = draft?.data || [];
                  const row = rows.find((item) => item.id === id);
                  if (row) row.status = 'CANCELLED';
                },
              ),
            ),
          );
        }

        patches.push(
          dispatch(
            ordersApi.util.updateQueryData('orderById', id, (draft: any) => {
              if (draft?.data) draft.data.status = 'CANCELLED';
              else if (draft) draft.status = 'CANCELLED';
            }),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Order', id: 'LIST' },
        { type: 'Order', id },
      ],
    }),
    invoices: builder.query<any, void>({
      query: () => ({ url: '/invoices' }),
    }),
  }),
});

export const {
  useMyOrdersQuery,
  useOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useInvoicesQuery,
} = ordersApi;
