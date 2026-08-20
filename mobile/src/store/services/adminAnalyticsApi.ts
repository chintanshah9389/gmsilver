import { api } from './api';

export const adminAnalyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminDashboard: builder.query<any, void>({
      query: () => '/analytics/dashboard',
      providesTags: ['Analytics'],
    }),
    adminActiveUsers: builder.query<any, void>({
      query: () => '/analytics/users/active',
      providesTags: ['Analytics'],
    }),
    adminMostViewed: builder.query<any, number | void>({
      query: (limit = 10) => `/analytics/products/most-viewed?limit=${limit || 10}`,
      providesTags: ['Analytics'],
    }),
    adminMostOrdered: builder.query<any, number | void>({
      query: (limit = 10) => `/analytics/products/most-ordered?limit=${limit || 10}`,
      providesTags: ['Analytics'],
    }),
    adminSearchKeywords: builder.query<any, void>({
      query: () => '/analytics/search/keywords',
      providesTags: ['Analytics'],
    }),
    adminRevenueChart: builder.query<any, number | void>({
      query: (months = 6) => `/analytics/revenue/chart?months=${months || 6}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useAdminDashboardQuery,
  useAdminActiveUsersQuery,
  useAdminMostViewedQuery,
  useAdminMostOrderedQuery,
  useAdminSearchKeywordsQuery,
  useAdminRevenueChartQuery,
} = adminAnalyticsApi;
