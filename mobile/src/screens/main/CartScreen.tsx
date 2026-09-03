import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import {
  useCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '@/store/services/cartApi';
import { getErrorMessage } from '@/lib/error-message';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import { useHideTabBarOnFocus } from '@/hooks/useHideTabBarOnFocus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen({ navigation }: any) {
  useHideTabBarOnFocus();
  const insets = useSafeAreaInsets();
  const { data, error, isError, isLoading, refetch } = useCartQuery();
  const [updateQty] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const items: any[] = data?.data?.items || [];
  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  useEffect(() => {
    if (isError && error) showSnack(getErrorMessage(error, 'Failed to load cart.'));
  }, [error, isError]);

  const bump = async (item: any, delta: number) => {
    try {
      if (item.unit === 'KG') {
        const weightGrams = Number(item.product?.weight || 0);
        const nextAmount = Math.max(
          0.1,
          Math.round((Number(item.unitAmount || 0.1) + delta * 0.1) * 10) / 10,
        );
        const nextQty =
          weightGrams > 0
            ? Math.max(1, Math.round((nextAmount * 1000) / weightGrams))
            : Math.max(1, item.quantity + delta);
        await updateQty({
          productId: item.productId,
          quantity: nextQty,
          unit: 'KG',
          unitAmount: nextAmount,
        }).unwrap();
      } else {
        await updateQty({
          productId: item.productId,
          quantity: Math.max(1, item.quantity + delta),
          unit: 'PIECES',
        }).unwrap();
      }
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed.'));
    }
  };

  const goCheckout = () => {
    navigation.navigate('Checkout');
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="Cart"
        subtitle={items.length ? `${items.length} items` : undefined}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        style={s.listFlex}
        data={isError ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={isError ? 'alert-circle-outline' : 'shopping-outline'}
            title={isError ? 'Couldn’t load cart' : 'Cart is empty'}
            subtitle={
              isError
                ? getErrorMessage(error, 'Pull to retry or check your connection.')
                : 'Add products from the catalog.'
            }
            actionLabel={isError ? 'Try again' : 'Browse'}
            onAction={() => (isError ? refetch() : navigation.navigate('Categories'))}
          />
        }
        renderItem={({ item, index }) => {
          const product = item.product || {};
          const facts = [
            product.sku,
            product.purity,
            product.weight ? `${product.weight} g` : null,
            item.unit === 'KG'
              ? `${Number(item.unitAmount || 0)} kg · ${item.quantity} pcs`
              : `${item.quantity} pcs`,
          ].filter(Boolean);

          return (
            <MotionReveal delay={Math.min(index * 24, 180)} duration={250} distance={10}>
              <View style={s.item}>
                {product.image1Url ? (
                  <Image
                    source={{ uri: product.image1Url }}
                    style={s.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={s.thumbPlaceholder}>
                    <Text style={s.thumbInitial}>{product.name?.[0]}</Text>
                  </View>
                )}
                <View style={s.itemInfo}>
                  <View style={s.itemHead}>
                    <Text style={s.itemName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Pressable
                      onPress={async () => {
                        try {
                          await removeItem(item.productId).unwrap();
                        } catch (e) {
                          showSnack(getErrorMessage(e, 'Failed.'));
                        }
                      }}
                      hitSlop={8}
                    >
                      <Text style={s.removeText}>Remove</Text>
                    </Pressable>
                  </View>
                  {facts.length ? (
                    <Text style={s.facts} numberOfLines={2}>
                      {facts.join(' · ')}
                    </Text>
                  ) : null}
                  <View style={s.qtyRow}>
                    <View style={s.qtyPill}>
                      <ScalePressable style={s.qtyBtn} scaleTo={0.92} onPress={() => bump(item, -1)}>
                        <Text style={s.qtyBtnText}>-</Text>
                      </ScalePressable>
                      <Text style={s.qtyVal}>
                        {item.unit === 'KG' ? `${Number(item.unitAmount || 0)}` : item.quantity}
                      </Text>
                      <ScalePressable style={s.qtyBtn} scaleTo={0.92} onPress={() => bump(item, 1)}>
                        <Text style={s.qtyBtnText}>+</Text>
                      </ScalePressable>
                    </View>
                  </View>
                </View>
              </View>
            </MotionReveal>
          );
        }}
      />

      {items.length > 0 ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={s.checkoutBtn} onPress={goCheckout}>
            <Text style={s.checkoutText}>Proceed to Checkout</Text>
          </Pressable>
        </View>
      ) : null}

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    ...E.softShadow,
  },
  thumb: { width: 88, height: 88, borderRadius: 10, backgroundColor: C.surface2 },
  thumbPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: C.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInitial: { color: C.textMuted, fontSize: 28, fontWeight: '700' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  itemName: { flex: 1, color: C.text, fontSize: 15, fontWeight: '700', fontFamily: F.serif },
  removeText: { color: C.ruby, fontSize: 12, fontWeight: '700' },
  facts: { color: C.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface3,
    padding: 3,
    gap: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: C.text, fontSize: 16, fontWeight: '700' },
  qtyVal: { minWidth: 28, textAlign: 'center', fontWeight: '800', color: C.text },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: C.borderHi,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  checkoutBtn: {
    backgroundColor: C.ruby,
    borderRadius: R.pill,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
