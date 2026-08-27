import { api } from './api';

export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    cart: builder.query<any, void>({
      query: () => ({ url: '/cart' }),
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<
      any,
      { productId: string; quantity: number; unit?: 'PIECES' | 'KG'; unitAmount?: number }
    >({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<
      any,
      {
        productId: string;
        quantity: number;
        unit?: 'PIECES' | 'KG';
        unitAmount?: number;
      }
    >({
      query: ({ productId, quantity, unit, unitAmount }) => ({
        url: `/cart/items/${productId}`,
        method: 'PUT',
        body: { quantity, unit, unitAmount },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<any, string>({
      query: (productId) => ({
        url: `/cart/items/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<any, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;
