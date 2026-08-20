import { api } from './api';

export const adminHomeWidgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminTopProductsWidget: builder.query<any, void>({
      query: () => '/home-widgets/top-products',
      providesTags: ['HomeWidget'],
    }),
    adminUpdateTopProductsWidget: builder.mutation<any, any>({
      query: (body) => ({
        url: '/home-widgets/top-products',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['HomeWidget'],
    }),
  }),
});

export const {
  useAdminTopProductsWidgetQuery,
  useAdminUpdateTopProductsWidgetMutation,
} = adminHomeWidgetsApi;
