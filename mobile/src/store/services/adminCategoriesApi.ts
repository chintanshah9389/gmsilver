import { api } from './api';

export const adminCategoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminCreateCategory: builder.mutation<any, FormData>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    adminUpdateCategory: builder.mutation<any, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    adminDeleteCategory: builder.mutation<any, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useAdminCreateCategoryMutation,
  useAdminUpdateCategoryMutation,
  useAdminDeleteCategoryMutation,
} = adminCategoriesApi;
