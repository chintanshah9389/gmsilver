import { api } from './api';

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // eslint-disable-next-line no-undef
  return btoa(binary);
}

export const adminExcelApi = api.injectEndpoints({
  endpoints: (builder) => ({
    adminExportProducts: builder.mutation<{ base64: string; blob: Blob }, void>({
      query: () => ({
        url: '/excel/export/products',
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          return { base64, blob };
        },
      }),
    }),
    adminExportUsers: builder.mutation<{ base64: string; blob: Blob }, void>({
      query: () => ({
        url: '/excel/export/users',
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          return { base64, blob };
        },
      }),
    }),
    adminExportOrders: builder.mutation<
      { base64: string; blob: Blob },
      Record<string, any> | void
    >({
      query: (params) => ({
        url: '/excel/export/orders',
        method: 'GET',
        params: params || undefined,
        responseHandler: async (response) => {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          return { base64, blob };
        },
      }),
    }),
    adminImportProducts: builder.mutation<any, FormData>({
      query: (body) => ({
        url: '/excel/import/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useAdminExportProductsMutation,
  useAdminExportUsersMutation,
  useAdminExportOrdersMutation,
  useAdminImportProductsMutation,
} = adminExcelApi;
