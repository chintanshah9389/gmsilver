import { api } from './api';

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    categories: builder.query<any, any>({
      query: (params) => ({ url: '/categories', params }),
      providesTags: ['Category'],
    }),
    products: builder.query<any, any>({
      query: (params) => ({ url: '/products', params }),
      providesTags: ['Product'],
    }),
    productById: builder.query<any, string>({
      query: (id) => ({ url: `/products/${id}` }),
      providesTags: ['Product'],
    }),
    searchProducts: builder.query<any, any>({
      query: ({ q, ...params }) => ({
        url: '/products/search',
        params: { q, ...params },
      }),
      providesTags: ['Product'],
    }),
  }),
});

export const {
  useCategoriesQuery,
  useProductsQuery,
  useProductByIdQuery,
  useSearchProductsQuery,
} = productsApi;
