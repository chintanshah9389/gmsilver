import { api } from './api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
    }),
    login: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    loginWithMpin: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/login/mpin', method: 'POST', body }),
    }),
    createMpin: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/mpin/create', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/password/forgot', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/password/reset', method: 'POST', body }),
    }),
    forgotMpin: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/mpin/forgot', method: 'POST', body }),
    }),
    resetMpin: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/mpin/reset', method: 'POST', body }),
    }),
    me: builder.query<any, void>({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useLoginWithMpinMutation,
  useCreateMpinMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useForgotMpinMutation,
  useResetMpinMutation,
  useMeQuery,
} = authApi;
