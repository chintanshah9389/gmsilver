import { api } from './api';

export const adminUsersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminUsers: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: '/users', params: params || undefined }),
      providesTags: ['AdminUser'],
    }),
    adminUserById: builder.query<any, string>({
      query: (id) => `/users/${id}`,
      providesTags: ['AdminUser'],
    }),
    adminCreateUser: builder.mutation<
      any,
      {
        name: string;
        email: string;
        phone?: string;
        password: string;
        role?: string;
        status?: string;
      }
    >({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['AdminUser'],
    }),
    adminUpdateUserStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminUser'],
    }),
    adminUpdateUserCredentials: builder.mutation<
      any,
      { id: string; password?: string; mpin?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/credentials`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminUser'],
    }),
    adminDeleteUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

export const {
  useAdminUsersQuery,
  useAdminUserByIdQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserStatusMutation,
  useAdminUpdateUserCredentialsMutation,
  useAdminDeleteUserMutation,
} = adminUsersApi;
