import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useCategoriesQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import ScreenHeader from '@/components/ScreenHeader';
import EmptyState from '@/components/EmptyState';
import { getCategoryImageSource } from '@/lib/category-image';

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const PAD = 16;
const GAP = 12;
const CARD_W = (SW - PAD * 2 - GAP) / COLS;
const CARD_H = CARD_W * 1.2;

export default function CategoriesScreen({ navigation }: any) {
  const { data, error, isError, isLoading } = useCategoriesQuery({ page: 1, limit: 100 });
  const [search, setSearch] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const allCategories: any[] = (data?.data || []).filter((c: any) => c.isActive !== false);
  const categories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [allCategories, search]);

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load categories.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="Collections"
        subtitle={search.trim() ? `${categories.length} matches` : 'Browse by category'}
      />

      <MotionReveal delay={40} duration={300} distance={8}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search collections…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={C.gold}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </MotionReveal>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={C.gold} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          contentContainerStyle={styles.list}
          columnWrapperStyle={categories.length > 0 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="magnify"
              title={search.trim() ? 'No collections found' : 'No categories yet'}
              subtitle={
                search.trim()
                  ? 'Try another search'
                  : 'Collections will appear here'
              }
            />
          }
          renderItem={({ item, index }) => {
            const count = item._count?.products ?? 0;
            return (
              <MotionReveal delay={Math.min(index * 24, 180)} duration={250} distance={10}>
                <ScalePressable
                  style={styles.card}
                  scaleTo={0.985}
                  onPress={() =>
                    navigation.navigate('ProductList', {
                      categoryId: item.id,
                      categoryName: item.name,
                    })
                  }
                >
                  <Image
                    source={getCategoryImageSource(item)}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <View style={styles.scrim} />
                  <View style={styles.copy}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.count}>{count} pieces</Text>
                  </View>
                </ScalePressable>
              </MotionReveal>
            );
          }}
        />
      )}

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PAD,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  searchIcon: { color: C.textMuted, fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: C.text, fontSize: 14, paddingVertical: 12 },
  list: { paddingHorizontal: PAD, paddingBottom: 110 },
  row: { gap: GAP, marginBottom: GAP },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: R.lg,
    overflow: 'hidden',
    backgroundColor: C.surface3,
    ...E.softShadow,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,21,22,0.36)',
  },
  copy: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  count: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
});
