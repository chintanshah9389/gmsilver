import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
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

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const PAD = 16;
const GAP = 12;
const CARD_W = (SW - PAD * 2 - GAP) / COLS;
const CARD_H = CARD_W * 1.2;

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

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader title="Collections" subtitle="Browse by category" />

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
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState title="No categories yet" subtitle="Collections will appear here" />
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
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholder}>
                      <Text style={styles.initial}>{item.name?.[0]?.toUpperCase() ?? '✦'}</Text>
                    </View>
                  )}
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
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: C.gold, fontSize: 36, fontWeight: '700' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,25,21,0.32)',
  },
  copy: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  count: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
});
