import { api } from './api';

export const adminBannersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminBanners: builder.query<any, boolean | void>({
      query: (all = true) => ({
        url: '/banners',
        params: all ? { all: 'true' } : undefined,
      }),
      providesTags: ['Banner'],
    }),
    adminCreateBanner: builder.mutation<any, FormData>({
      query: (body) => ({ url: '/banners', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    adminUpdateBanner: builder.mutation<any, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/banners/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Banner'],
    }),
    adminDeleteBanner: builder.mutation<any, string>({
      query: (id) => ({ url: `/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),
  }),
});

export const {
  useAdminBannersQuery,
  useAdminCreateBannerMutation,
  useAdminUpdateBannerMutation,
  useAdminDeleteBannerMutation,
} = adminBannersApi;
