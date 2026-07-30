import { api } from './api';

export const bannersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    banners: builder.query<any, void>({
      query: () => ({ url: '/banners' }),
      providesTags: ['Banner'],
    }),
  }),
});

export const { useBannersQuery } = bannersApi;
