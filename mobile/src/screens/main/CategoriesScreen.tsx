import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Image,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useCategoriesQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const PAD = 16;
const GAP = 10;
const CARD_W = (SW - PAD * 2 - GAP) / COLS;
const CARD_H = CARD_W * 1.25;

const PALETTE = [
  { bg: '#1C1528', accent: '#9B8EC4' },
  { bg: '#12201A', accent: '#6BAF82' },
  { bg: '#1F1415', accent: '#BF7070' },
  { bg: '#121820', accent: '#6699BB' },
  { bg: '#1E1720', accent: '#A87BB0' },
  { bg: '#1A1D12', accent: '#8FA860' },
  { bg: '#201A12', accent: '#B89060' },
  { bg: '#121A1F', accent: '#5FA0B5' },
];

export default function CategoriesScreen({ navigation }: any) {
  const { data, error, isError, isLoading } = useCategoriesQuery({ page: 1, limit: 100 });
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const categories: any[] = (data?.data || []).filter((c: any) => c.isActive !== false);

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load categories.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const pal = PALETTE[index % PALETTE.length];
    const count = item._count?.products ?? 0;

    return (
      <MotionReveal delay={Math.min(index * 26, 220)} duration={250} distance={10}>
        <ScalePressable
          style={styles.card}
          scaleTo={0.985}
          onPress={() => navigation.navigate('ProductList', { categoryId: item.id, categoryName: item.name })}
        >
          {/* Image or placeholder */}
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: pal.bg }]}>
              {/* Decorative rings */}
              <View style={[styles.ring, styles.ringOuter, { borderColor: pal.accent + '22' }]} />
              <View style={[styles.ring, styles.ringInner, { borderColor: pal.accent + '44' }]} />
              <Text style={[styles.initial, { color: pal.accent + 'BB' }]}>
                {item.name?.[0]?.toUpperCase() ?? '✦'}
              </Text>
            </View>
          )}

          {/* Scrim layers for gradient effect */}
          <View style={styles.scrim1} />
          <View style={styles.scrim2} />
          <View style={styles.scrim3} />

          {/* Top badge: item count */}
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}

          {/* Bottom label */}
          <View style={styles.footer}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <View style={styles.dividerLine} />
          </View>
        </ScalePressable>
      </MotionReveal>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerSub}>COLLECTIONS</Text>
      <Text style={styles.headerTitle}>Shop by Category</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <PremiumBackground />
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ActivityIndicator size="large" color={C.silver} />
        <Text style={styles.loaderText}>Loading collections…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <FlatList
        style={styles.listFlex}
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  listFlex: { flex: 1 },
  loader: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: C.textSub, fontSize: 13, letterSpacing: 1 },

  header: { paddingHorizontal: PAD, paddingTop: 22, paddingBottom: 16 },
  headerSub: { color: C.silver, fontSize: 10, fontWeight: '700', letterSpacing: 3.2, marginBottom: 6 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },

  list: { paddingHorizontal: PAD, paddingBottom: 32 },
  row: { gap: GAP, marginBottom: GAP },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...E.cardShadow,
  },

  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  ringOuter: { width: CARD_W * 0.85, height: CARD_W * 0.85 },
  ringInner: { width: CARD_W * 0.52, height: CARD_W * 0.52 },
  initial: { fontSize: CARD_W * 0.28, fontWeight: '700', letterSpacing: 2 },

  // Multi-layer scrim
  scrim1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  scrim2: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.65,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  scrim3: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.42,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(192,192,192,0.16)',
    borderWidth: 1,
    borderColor: C.borderHi,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: C.silverLt, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  dividerLine: {
    height: 1.5,
    width: 28,
    backgroundColor: C.silver,
    marginTop: 6,
    borderRadius: 2,
    opacity: 0.6,
  },
  name: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
});
