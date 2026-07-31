import React, { useEffect, useState } from 'react';
import {
  Dimensions, FlatList, Image, StyleSheet,
  Text, TextInput, View, ActivityIndicator, StatusBar,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useProductsQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

const { width: SW } = Dimensions.get('window');
const PAD = 14;
const GAP = 10;
const CARD_W = (SW - PAD * 2 - GAP) / 2;

export default function ProductListScreen({ route, navigation }: any) {
  const categoryId   = route.params?.categoryId;
  const categoryName = route.params?.categoryName ?? 'Products';
  const [search, setSearch] = useState('');
  const { data, error, isError, isLoading } = useProductsQuery({ page: 1, limit: 100, categoryId });
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const allProducts: any[] = data?.data || [];
  const products = search
    ? allProducts.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
    : allProducts;

  useEffect(() => {
    if (isError && error) { setSnackMsg(getErrorMessage(error, 'Failed to load products.')); setSnackVisible(true); }
  }, [error, isError]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotionReveal delay={Math.min(index * 26, 220)} duration={250} distance={10}>
      <ScalePressable
        style={s.card}
        scaleTo={0.985}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        {item.image1Url ? (
          <Image source={{ uri: item.image1Url }} style={s.cardImg} resizeMode="cover" />
        ) : (
          <View style={s.cardImgPlaceholder}>
            <Text style={s.cardImgInitial}>{item.name?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={s.cardBody}>
          <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
          <Text style={s.cardPrice}>₹{Number(item.price).toLocaleString()}</Text>
          {item.sku ? <Text style={s.cardSku}>{item.sku}</Text> : null}
        </View>
      </ScalePressable>
    </MotionReveal>
  );

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <MotionReveal delay={30} duration={420} distance={18}>
        <View style={s.header}>
          <ScalePressable style={s.backBtn} scaleTo={0.95} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>‹</Text>
          </ScalePressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>{categoryName}</Text>
            <Text style={s.headerSub}>{allProducts.length} products</Text>
          </View>
        </View>
      </MotionReveal>

      {/* Search */}
      <MotionReveal delay={80} duration={360} distance={14}>
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search products…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={C.silver}
          />
        </View>
      </MotionReveal>

      {isLoading ? (
        <View style={s.loader}><ActivityIndicator color={C.silver} /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={s.list}
          columnWrapperStyle={s.row}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={s.empty}>No products found</Text>}
        />
      )}

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>{snackMsg}</Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: C.surface2 },
  backText: { color: C.silver, fontSize: 22, lineHeight: 28 },
  headerTitle: { color: C.text, fontSize: 22, fontWeight: '800' },
  headerSub: { color: C.textSub, fontSize: 11, marginTop: 2, letterSpacing: 0.8, textTransform: 'uppercase' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: PAD, marginBottom: 14, backgroundColor: C.surfaceSoft, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchIcon: { color: C.textMuted, fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: C.text, fontSize: 14, paddingVertical: 11 },
  list: { paddingHorizontal: PAD, paddingBottom: 24 },
  row: { gap: GAP, marginBottom: GAP },
  card: { width: CARD_W, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...E.softShadow },
  cardImg: { width: CARD_W, height: CARD_W * 0.85 },
  cardImgPlaceholder: { width: CARD_W, height: CARD_W * 0.85, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  cardImgInitial: { color: C.textMuted, fontSize: CARD_W * 0.25, fontWeight: '700' },
  cardBody: { padding: 10 },
  cardName: { color: C.text, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  cardPrice: { color: C.silver, fontSize: 14, fontWeight: '800', marginTop: 5, letterSpacing: 0.2 },
  cardSku: { color: C.textMuted, fontSize: 10, marginTop: 2 },
  empty: { color: C.textSub, textAlign: 'center', marginTop: 48, fontSize: 14 },
});


