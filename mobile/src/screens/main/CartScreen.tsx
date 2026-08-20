import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
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
  const { data, error, isError } = useCartQuery();
  const [updateQty] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const cart = data?.data;
  const items: any[] = cart?.items || [];
  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  useEffect(() => {
    if (isError && error) showSnack(getErrorMessage(error, 'Failed to load cart.'));
  }, [error, isError]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0),
    0,
  );

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="My Cart"
        subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Add silver pieces from the catalog to place an order"
            actionLabel="Continue shopping"
            onAction={() => navigation.navigate('ProductList')}
          />
        }
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 24, 180)} duration={250} distance={10}>
            <View style={s.item}>
              {item.product?.image1Url ? (
                <Image
                  source={{ uri: item.product.image1Url }}
                  style={s.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={s.thumbPlaceholder}>
                  <Text style={s.thumbInitial}>{item.product?.name?.[0]}</Text>
                </View>
              )}
              <View style={s.itemInfo}>
                <Text style={s.itemName} numberOfLines={2}>
                  {item.product?.name}
                </Text>
                <Text style={s.itemPrice}>
                  ?{Number(item.product?.price || 0).toLocaleString()}
                </Text>
                <View style={s.qtyRow}>
                  <ScalePressable
                    style={s.qtyBtn}
                    scaleTo={0.92}
                    onPress={async () => {
                      try {
                        await updateQty({
                          productId: item.productId,
                          quantity: Math.max(1, item.quantity - 1),
                        }).unwrap();
                      } catch (e) {
                        showSnack(getErrorMessage(e, 'Failed.'));
                      }
                    }}
                  >
                    <Text style={s.qtyBtnText}>-</Text>
                  </ScalePressable>
                  <Text style={s.qtyVal}>{item.quantity}</Text>
                  <ScalePressable
                    style={s.qtyBtn}
                    scaleTo={0.92}
                    onPress={async () => {
                      try {
                        await updateQty({
                          productId: item.productId,
                          quantity: item.quantity + 1,
                        }).unwrap();
                      } catch (e) {
                        showSnack(getErrorMessage(e, 'Failed.'));
                      }
                    }}
                  >
                    <Text style={s.qtyBtnText}>+</Text>
                  </ScalePressable>
                  <ScalePressable
                    style={s.removeBtn}
                    scaleTo={0.92}
                    onPress={async () => {
                      try {
                        await removeItem(item.productId).unwrap();
                      } catch (e) {
                        showSnack(getErrorMessage(e, 'Failed.'));
                      }
                    }}
                  >
                    <Text style={s.removeText}>Remove</Text>
                  </ScalePressable>
                </View>
              </View>
            </View>
          </MotionReveal>
        )}
      />

      {items.length > 0 ? (
        <View style={[s.footer, { bottom: Math.max(insets.bottom, 16) }]}>
          <View>
            <Text style={s.totalLabel}>Estimated total</Text>
            <Text style={s.totalVal}>?{total.toLocaleString()}</Text>
          </View>
          <ScalePressable
            style={s.checkoutBtn}
            scaleTo={0.97}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Text style={s.checkoutText}>Checkout →</Text>
          </ScalePressable>
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
  list: { paddingHorizontal: 16, paddingBottom: 120, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 0,
    paddingVertical: 16,
  },
  thumb: { width: 96, height: 110 },
  thumbPlaceholder: {
    width: 96,
    height: 110,
    backgroundColor: C.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInitial: { color: C.textMuted, fontSize: 28, fontWeight: '700' },
  itemInfo: { flex: 1, padding: 14 },
  itemName: { color: C.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  itemPrice: { color: C.ruby, fontSize: 15, fontWeight: '600', marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: C.text, fontSize: 16, fontWeight: '700' },
  qtyVal: {
    minWidth: 24,
    textAlign: 'center',
    color: C.text,
    fontWeight: '800',
    fontSize: 14,
  },
  removeBtn: { marginLeft: 'auto' },
  removeText: { color: C.error, fontSize: 12, fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.borderHi,
    padding: 14,
    ...E.floatShadow,
  },
  totalLabel: { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  totalVal: { color: C.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  checkoutBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 0,
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
});
