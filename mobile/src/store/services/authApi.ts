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
    resetMpinWithPassword: builder.mutation<any, {
      identifier?: string;
      email?: string;
      password: string;
      newMpin: string;
      confirmMpin: string;
    }>({
      query: (body) => ({ url: '/auth/mpin/reset-with-password', method: 'POST', body }),
    }),
    lookupSecurityQuestion: builder.mutation<{ data: { email: string; question: string } }, {
      identifier?: string;
      email?: string;
    }>({
      query: (body) => ({ url: '/auth/security-question', method: 'POST', body }),
    }),
    resetWithSecurityQuestion: builder.mutation<any, {
      identifier?: string;
      email?: string;
      securityAnswer: string;
      newPassword: string;
      confirmPassword: string;
      newMpin: string;
      confirmMpin: string;
    }>({
      query: (body) => ({ url: '/auth/reset-with-security-question', method: 'POST', body }),
    }),
    me: builder.query<any, void>({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['User'],
    }),
    changePassword: builder.mutation<any, {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>({
      query: (body) => ({ url: '/auth/password/change', method: 'PATCH', body }),
    }),
    changeMpin: builder.mutation<any, {
      currentMpin: string;
      newMpin: string;
      confirmMpin: string;
    }>({
      query: (body) => ({ url: '/auth/mpin/change', method: 'PATCH', body }),
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
  useResetMpinWithPasswordMutation,
  useLookupSecurityQuestionMutation,
  useResetWithSecurityQuestionMutation,
  useMeQuery,
  useChangePasswordMutation,
  useChangeMpinMutation,
} = authApi;
