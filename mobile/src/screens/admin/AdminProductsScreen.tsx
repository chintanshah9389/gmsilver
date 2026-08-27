import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import { PAGE_SIZE, useProductsQuery } from '@/store/services/productsApi';
import {
  useAdminBulkDeleteProductsMutation,
  useAdminDeleteProductMutation,
} from '@/store/services/adminProductsApi';
import { getErrorMessage } from '@/lib/error-message';
import { isAdmin } from '@/lib/roles';
import { useAppSelector } from '@/hooks/redux';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

export default function AdminProductsScreen({ navigation }: any) {
  const role = useAppSelector((st) => st.auth.user?.role);
  const canDelete = isAdmin(role);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const { data, error, isError, isFetching, refetch, isLoading } = useProductsQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    includeInactive: 'true',
  });
  const [deleteProduct] = useAdminDeleteProductMutation();
  const [bulkDelete] = useAdminBulkDeleteProductsMutation();
  const [snack, setSnack] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load products.'));
  }, [error, isError]);

  const products: any[] = useMemo(() => data?.data || [], [data]);
  const hasNext = Boolean(data?.meta?.hasNext);
  const loadingMore = isFetching && page > 1;

  const onRefresh = () => {
    if (page === 1) refetch();
    else setPage(1);
  };

  const onEndReached = () => {
    if (!hasNext || isFetching || isLoading) return;
    setPage((p) => p + 1);
  };

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onDelete = (id: string) => {
    if (!canDelete) {
      setSnack('Only ADMIN can delete products.');
      return;
    }
    Alert.alert('Delete product', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(id).unwrap();
            setPage(1);
            setSelected((prev) => prev.filter((x) => x !== id));
            setSnack('Product deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete product.'));
          }
        },
      },
    ]);
  };

  const onBulkDelete = () => {
    if (!canDelete) {
      setSnack('Only ADMIN can delete products.');
      return;
    }
    if (!selected.length) return;
    Alert.alert('Bulk delete', `Delete ${selected.length} products?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bulkDelete(selected).unwrap();
            setSelected([]);
            setPage(1);
            setSnack('Products deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete products.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader
        title="Products"
        onBack={() => navigation.goBack()}
        right={
          <ScalePressable onPress={() => navigation.navigate('AdminProductForm')}>
            <Text style={{ color: C.ruby, fontWeight: '700' }}>+</Text>
          </ScalePressable>
        }
      />
      <View style={{ paddingHorizontal: 16 }}>
        <TextInput
          style={s.input}
          placeholder="Search products"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {canDelete && selected.length > 0 ? (
          <ScalePressable style={[s.actionBtn, s.actionBtnDanger, { marginBottom: 8 }]} onPress={onBulkDelete}>
            <Text style={[s.actionText, s.actionTextDanger]}>Delete selected ({selected.length})</Text>
          </ScalePressable>
        ) : null}
      </View>
      {isLoading && page === 1 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={C.ruby} /> : null
          }
          ListEmptyComponent={<Text style={s.empty}>No products</Text>}
          renderItem={({ item }) => {
            const img = item.image1Url || item.imageUrl || item.images?.[0]?.url;
            const checked = selected.includes(item.id);
            return (
              <View style={s.card}>
                <View style={s.row}>
                  {canDelete ? (
                    <ScalePressable onPress={() => toggle(item.id)} style={s.chip}>
                      <Text style={s.chipText}>{checked ? '✓' : '○'}</Text>
                    </ScalePressable>
                  ) : null}
                  {img ? (
                    <Image source={{ uri: img }} style={{ width: 48, height: 48, borderRadius: 6 }} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{item.name}</Text>
                    <Text style={s.meta}>
                      {item.sku} · {item.origin === 'IMPORTED' ? 'Imported' : 'Indian'}
                    </Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <ScalePressable
                    style={s.actionBtn}
                    onPress={() => navigation.navigate('AdminProductForm', { productId: item.id })}
                  >
                    <Text style={s.actionText}>Edit</Text>
                  </ScalePressable>
                  {canDelete ? (
                    <ScalePressable
                      style={[s.actionBtn, s.actionBtnDanger]}
                      onPress={() => onDelete(item.id)}
                    >
                      <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
                    </ScalePressable>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
