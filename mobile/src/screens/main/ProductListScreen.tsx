import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useProductsQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C, R } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import MotionReveal from '@/components/MotionReveal';
import ProductCard, { PRODUCT_GRID } from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';

const { PAD, GAP } = PRODUCT_GRID;

export default function ProductListScreen({ route, navigation }: any) {
  const categoryId = route.params?.categoryId;
  const categoryName = route.params?.categoryName ?? 'Products';
  const showInlineHeader = !!categoryId && navigation.canGoBack?.();
  const [search, setSearch] = useState('');
  const { data, error, isError, isLoading } = useProductsQuery({
    page: 1,
    limit: 100,
    categoryId,
  });
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const allProducts: any[] = data?.data || [];
  const products = search
    ? allProducts.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    : allProducts;

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load products.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScreenHeader
        title={showInlineHeader ? categoryName : 'All Products'}
        subtitle={`${allProducts.length} pieces`}
        onBack={showInlineHeader ? () => navigation.goBack() : undefined}
      />

      <MotionReveal delay={60} duration={320} distance={10}>
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search products…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={C.gold}
          />
        </View>
      </MotionReveal>

      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator color={C.gold} />
        </View>
      ) : (
        <FlatList
          style={s.listFlex}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={s.list}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <MotionReveal delay={Math.min(index * 20, 160)} duration={240} distance={8}>
              <ProductCard
                item={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              />
            </MotionReveal>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="magnify"
              title="No products found"
              subtitle="Try another search or browse categories"
            />
          }
        />
      )}

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  listFlex: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PAD,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  searchIcon: { color: C.textMuted, fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: C.text, fontSize: 14, paddingVertical: 12 },
  list: { paddingHorizontal: PAD, paddingBottom: 110 },
  row: { gap: GAP, marginBottom: GAP },
});
