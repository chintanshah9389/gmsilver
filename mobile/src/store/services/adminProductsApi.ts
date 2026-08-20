import { api } from './api';

export const adminProductsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminCreateProduct: builder.mutation<any, FormData>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    adminUpdateProduct: builder.mutation<any, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    adminDeleteProduct: builder.mutation<any, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    adminBulkDeleteProducts: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: '/products/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useAdminCreateProductMutation,
  useAdminUpdateProductMutation,
  useAdminDeleteProductMutation,
  useAdminBulkDeleteProductsMutation,
} = adminProductsApi;
