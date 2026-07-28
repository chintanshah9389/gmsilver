import { api } from './api';

export const wishlistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    wishlist: builder.query<any, void>({
      query: () => ({ url: '/wishlist' }),
      providesTags: ['Wishlist'],
    }),
    addWishlist: builder.mutation<any, string>({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: 'POST' }),
      invalidatesTags: ['Wishlist'],
    }),
    removeWishlist: builder.mutation<any, string>({
      query: (productId) => ({
        url: `/wishlist/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
});

export const {
  useWishlistQuery,
  useAddWishlistMutation,
  useRemoveWishlistMutation,
} = wishlistApi;
