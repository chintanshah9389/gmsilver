import { api } from './api';

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myOrders: builder.query<any, any>({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),
    orderById: builder.query<any, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation<any, { notes?: string }>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    cancelOrder: builder.mutation<any, string>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: ['Order'],
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
