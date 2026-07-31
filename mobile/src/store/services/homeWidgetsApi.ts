import { api } from './api';

export const homeWidgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    topProductsWidget: builder.query<any, void>({
      query: () => ({ url: '/home-widgets/top-products' }),
      providesTags: ['HomeWidget'],
    }),
  }),
});

export const { useTopProductsWidgetQuery } = homeWidgetsApi;