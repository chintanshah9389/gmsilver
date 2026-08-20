import { api } from './api';

export const adminInvoicesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminGenerateInvoice: builder.mutation<any, string>({
      query: (orderId) => ({
        url: `/invoices/generate/${orderId}`,
        method: 'POST',
      }),
      invalidatesTags: ['InvoiceAdmin', 'AdminOrder'],
    }),
    adminDeleteInvoice: builder.mutation<any, string>({
      query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['InvoiceAdmin', 'AdminOrder'],
    }),
    adminBulkDeleteInvoices: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: '/invoices/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['InvoiceAdmin'],
    }),
  }),
});

export const {
  useAdminGenerateInvoiceMutation,
  useAdminDeleteInvoiceMutation,
  useAdminBulkDeleteInvoicesMutation,
} = adminInvoicesApi;
