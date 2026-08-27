import { api } from './api';

export const PAGE_SIZE = 100;

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    categories: builder.query<any, any>({
      query: (params) => ({ url: '/categories', params }),
      providesTags: ['Category'],
    }),
    products: builder.query<any, any>({
      query: (params) => ({ url: '/products', params }),
      providesTags: ['Product'],
      // Cache by filters only — pages are merged for infinite scroll.
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { page: _page, ...filters } = queryArgs || {};
        return `${endpointName}(${JSON.stringify(filters)})`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg?.page || Number(arg.page) <= 1) {
          currentCache.data = newItems.data;
          currentCache.meta = newItems.meta;
          return;
        }

        const existingIds = new Set((currentCache.data || []).map((item: any) => item.id));
        for (const item of newItems.data || []) {
          if (!existingIds.has(item.id)) {
            currentCache.data.push(item);
          }
        }
        currentCache.meta = newItems.meta;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
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
