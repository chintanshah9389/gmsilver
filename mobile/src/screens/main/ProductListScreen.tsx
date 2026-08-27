import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { PAGE_SIZE, useProductsQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import PremiumBackground from '@/components/PremiumBackground';
import MotionReveal from '@/components/MotionReveal';
import ProductCard, { PRODUCT_GRID } from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';

const { PAD } = PRODUCT_GRID;

type ProductFilterId = 'all' | 'indian' | 'imported' | 'in_stock';

const PRODUCT_FILTERS: { id: ProductFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'indian', label: 'Indian' },
  { id: 'imported', label: 'Imported' },
  { id: 'in_stock', label: 'In stock' },
];

export default function ProductListScreen({ route, navigation }: any) {
  const categoryId = route.params?.categoryId;
  const categoryName = route.params?.categoryName ?? 'Products';
  const showInlineHeader = !!categoryId && navigation.canGoBack?.();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<ProductFilterId>('all');
  const [page, setPage] = useState(1);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, filter, debouncedSearch]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      page,
      limit: PAGE_SIZE,
      categoryId,
      search: debouncedSearch || undefined,
    };

    if (filter === 'indian') {
      params.origin = 'INDIAN';
    } else if (filter === 'imported') {
      params.origin = 'IMPORTED';
    } else if (filter === 'in_stock') {
      params.isAvailable = 'true';
    }

    return params;
  }, [categoryId, filter, page, debouncedSearch]);

  const { data, error, isError, isLoading, isFetching, refetch } = useProductsQuery(queryParams);
  const products: any[] = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total ?? products.length;
  const hasNext = Boolean(meta?.hasNext);
  const loadingMore = isFetching && page > 1;
  const refreshing = isFetching && page === 1 && !isLoading;

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load products.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  const onRefresh = useCallback(() => {
    if (page === 1) {
      refetch();
      return;
    }
    setPage(1);
  }, [page, refetch]);

  const onEndReached = useCallback(() => {
    if (!hasNext || isFetching || isLoading) return;
    setPage((current) => current + 1);
  }, [hasNext, isFetching, isLoading]);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScreenHeader
        title={showInlineHeader ? categoryName : 'The Collection'}
        subtitle={`${total} pieces`}
        onBack={showInlineHeader ? () => navigation.goBack() : undefined}
      />

      <MotionReveal delay={40} duration={300} distance={8}>
        <View style={s.toolbar}>
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>⌕</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search jewelry…"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              selectionColor={C.gold}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <View style={s.filterRow}>
            {PRODUCT_FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <ScalePressable
                  key={item.id}
                  style={[s.filterChip, active && s.filterChipOn]}
                  scaleTo={0.97}
                  onPress={() => setFilter(item.id)}
                >
                  <Text style={[s.filterText, active && s.filterTextOn]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </View>
        </View>
      </MotionReveal>

      {isLoading && page === 1 ? (
        <View style={s.loader}>
          <ActivityIndicator color={C.gold} />
        </View>
      ) : (
        <FlatList
          style={s.listFlex}
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <MotionReveal delay={Math.min(index * 12, 120)} duration={220} distance={8}>
              <ProductCard
                variant="editorial"
                item={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              />
            </MotionReveal>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.footerLoader}>
                <ActivityIndicator color={C.gold} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="magnify"
              title="No products found"
              subtitle="Try another filter or search"
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
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  toolbar: {
    paddingHorizontal: PAD,
    marginBottom: 12,
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  searchIcon: { color: C.textMuted, fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    paddingVertical: 12,
    fontFamily: F.sans,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  filterChipOn: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: F.sans,
  },
  filterTextOn: {
    color: '#FFFFFF',
  },
  list: { paddingHorizontal: PAD, paddingBottom: 110, gap: 8, flexGrow: 1 },
});
