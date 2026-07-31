import React, { useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, TouchableOpacity, View, Image, StatusBar,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import {
  useCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation,
} from '@/store/services/cartApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

export default function CartScreen({ navigation }: any) {
  const { data, error, isError } = useCartQuery();
  const [updateQty] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const cart = data?.data;
  const items: any[] = cart?.items || [];
  const showSnack = (msg: string) => { setSnackMsg(msg); setSnackVisible(true); };

  useEffect(() => {
    if (isError && error) showSnack(getErrorMessage(error, 'Failed to load cart.'));
  }, [error, isError]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotionReveal delay={Math.min(index * 28, 220)} duration={260} distance={10}>
      <View style={s.item}>
        {item.product?.image1Url
          ? <Image source={{ uri: item.product.image1Url }} style={s.thumb} resizeMode="cover" />
          : <View style={s.thumbPlaceholder}><Text style={s.thumbInitial}>{item.product?.name?.[0]}</Text></View>
        }
        <View style={s.itemInfo}>
          <Text style={s.itemName} numberOfLines={2}>{item.product?.name}</Text>
          <Text style={s.itemPrice}>Rs. {Number(item.product?.price || 0).toLocaleString()}</Text>
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.qtyBtn} onPress={async () => {
              try { await updateQty({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) }).unwrap(); }
              catch (e) { showSnack(getErrorMessage(e, 'Failed.')); }
            }}>
              <Text style={s.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={s.qtyVal}>{item.quantity}</Text>
            <TouchableOpacity style={s.qtyBtn} onPress={async () => {
              try { await updateQty({ productId: item.productId, quantity: item.quantity + 1 }).unwrap(); }
              catch (e) { showSnack(getErrorMessage(e, 'Failed.')); }
            }}>
              <Text style={s.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.removeBtn} onPress={async () => {
              try { await removeItem(item.productId).unwrap(); }
              catch (e) { showSnack(getErrorMessage(e, 'Failed.')); }
            }}>
              <Text style={s.removeText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MotionReveal>
  );

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <MotionReveal delay={30} duration={420} distance={18}>
        <View style={s.header}>
          <Text style={s.headerTitle}>My Cart</Text>
          <Text style={s.headerSub}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
        </View>
      </MotionReveal>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>O</Text>
            <Text style={s.emptyText}>Your cart is empty</Text>
            <Text style={s.emptySub}>Browse categories to find products</Text>
          </View>
        }
      />
      {items.length > 0 && (
        <MotionReveal delay={140} duration={360} distance={12}>
          <View style={s.footer}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>Rs. {Number(cart?.subtotal || 0).toLocaleString()}</Text>
            </View>
            <ScalePressable style={s.checkoutBtn} scaleTo={0.97} onPress={() => navigation.navigate('Checkout')}>
              <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
            </ScalePressable>
          </View>
        </MotionReveal>
      )}
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>{snackMsg}</Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  headerSub: { color: C.textSub, fontSize: 11, marginTop: 3, letterSpacing: 1, textTransform: 'uppercase' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },

  item: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border, gap: 12, ...E.softShadow },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  thumbPlaceholder: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: C.textMuted, fontSize: 22, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  itemPrice: { color: C.silver, fontSize: 15, fontWeight: '800', marginTop: 4, letterSpacing: 0.2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface2, ...E.softShadow },
  qtyBtnText: { color: C.silver, fontSize: 16, fontWeight: '700', lineHeight: 20 },
  qtyVal: { color: C.text, fontSize: 14, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto', padding: 6 },
  removeText: { color: C.error, fontSize: 12 },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 40, color: C.textMuted },
  emptyText: { color: C.text, fontSize: 16, fontWeight: '600' },
  emptySub: { color: C.textMuted, fontSize: 13 },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, ...E.cardShadow },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { color: C.textSub, fontSize: 14 },
  totalValue: { color: C.text, fontSize: 18, fontWeight: '800' },
  checkoutBtn: { backgroundColor: C.silver, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...E.buttonShadow },
  checkoutBtnText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});



