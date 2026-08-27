import React, { useEffect, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useWishlistQuery, useRemoveWishlistMutation } from '@/store/services/wishlistApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import MotionReveal from '@/components/MotionReveal';
import ProductCard, { PRODUCT_GRID } from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';

const { PAD, GAP } = PRODUCT_GRID;

export default function WishlistScreen({ navigation }: any) {
  const { data, error, isError, isLoading, refetch } = useWishlistQuery();
  const [remove] = useRemoveWishlistMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const items: any[] = data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load wishlist.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="Wishlist"
        subtitle={`${items.length} saved`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={isError ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={s.list}
        columnWrapperStyle={!isError && items.length ? s.row : undefined}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={isError ? 'alert-circle-outline' : 'heart-outline'}
            title={isError ? 'Couldn’t load wishlist' : 'Your wishlist is empty'}
            subtitle={
              isError
                ? getErrorMessage(error, 'Pull to retry or check your connection.')
                : 'Save pieces you love while browsing the catalog'
            }
            actionLabel={isError ? 'Try again' : 'Browse products'}
            onAction={() => (isError ? refetch() : navigation.navigate('Categories'))}
          />
        }
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 20, 160)} duration={240} distance={8}>
            <ProductCard
              variant="grid"
              item={{
                id: item.productId,
                name: item.product?.name,
                price: item.product?.price,
                image1Url: item.product?.image1Url,
              }}
              wished
              onWish={async () => {
                try {
                  await remove(item.productId).unwrap();
                } catch (e) {
                  setSnackMsg(getErrorMessage(e, 'Failed to remove.'));
                  setSnackVisible(true);
                }
              }}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: item.productId })
              }
            />
          </MotionReveal>
        )}
      />
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2500}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { paddingHorizontal: PAD, paddingBottom: 110, flexGrow: 1 },
  row: { gap: GAP, marginBottom: GAP },
});
