import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useWishlistQuery, useRemoveWishlistMutation } from '@/store/services/wishlistApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

export default function WishlistScreen({ navigation }: any) {
  const { data, error, isError } = useWishlistQuery();
  const [remove] = useRemoveWishlistMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const items: any[] = data?.data || [];

  useEffect(() => {
    if (isError && error) { setSnackMsg(getErrorMessage(error, 'Failed.')); setSnackVisible(true); }
  }, [error, isError]);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <MotionReveal delay={30} duration={420} distance={18}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Wishlist</Text>
          <Text style={s.headerSub}>{items.length} saved items</Text>
        </View>
      </MotionReveal>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 28, 220)} duration={250} distance={10}>
            <View style={s.card}>
              <ScalePressable
                style={s.cardLeft}
                scaleTo={0.985}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
              >
                <View style={s.cardLeftInner}>
                  {item.product?.image1Url
                    ? <Image source={{ uri: item.product.image1Url }} style={s.thumb} resizeMode="cover" />
                    : <View style={s.thumbPlaceholder}><Text style={s.thumbInitial}>{item.product?.name?.[0]}</Text></View>
                  }
                  <View style={s.info}>
                    <Text style={s.name} numberOfLines={2}>{item.product?.name}</Text>
                    <Text style={s.price}>₹{Number(item.product?.price || 0).toLocaleString()}</Text>
                  </View>
                </View>
              </ScalePressable>
              <TouchableOpacity style={s.removeBtn} onPress={() => remove(item.productId)}>
                <Text style={s.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </MotionReveal>
        )}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>♡</Text>
            <Text style={s.emptyText}>No saved items</Text>
          </View>
        }
      />
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>{snackMsg}</Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  headerSub: { color: C.textSub, fontSize: 11, marginTop: 3, letterSpacing: 1, textTransform: 'uppercase' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center', ...E.softShadow },
  cardLeft: { flex: 1 },
  cardLeftInner: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  thumbPlaceholder: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: C.textMuted, fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  name: { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  price: { color: C.silver, fontSize: 15, fontWeight: '800', marginTop: 4, letterSpacing: 0.2 },
  removeBtn: { paddingHorizontal: 14, paddingVertical: 20 },
  removeText: { color: C.error, fontSize: 14, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 40, color: C.textMuted },
  emptyText: { color: C.textSub, fontSize: 15 },
});

