import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useProductsQuery, useCategoriesQuery } from '@/store/services/productsApi';
import { useBannersQuery } from '@/store/services/bannersApi';
import { useTopProductsWidgetQuery } from '@/store/services/homeWidgetsApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import LuxCarousel, { LuxCarouselItem } from '@/components/LuxCarousel';
import ProductCard, { PRODUCT_GRID } from '@/components/ProductCard';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import FilterPills, { ProductFilterId } from '@/components/FilterPills';
import { getCategoryImageSource } from '@/lib/category-image';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import { E } from '@/theme/effects';

const { PAD } = PRODUCT_GRID;
const RING = ['#D4E4FA', '#FFE088', '#FFDAD8', '#B9C8DE'];

export default function HomeScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<ProductFilterId>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      page: 1,
      limit: 8,
      search: debouncedSearch || undefined,
    };
    if (filter === 'indian') params.origin = 'INDIAN';
    else if (filter === 'imported') params.origin = 'IMPORTED';
    else if (filter === 'in_stock') params.isAvailable = 'true';
    return params;
  }, [filter, debouncedSearch]);

  const { data, error, isError } = useProductsQuery(queryParams);
  const { data: widgetData } = useTopProductsWidgetQuery();
  const { data: bannerData } = useBannersQuery();
  const { data: catData } = useCategoriesQuery({ page: 1, limit: 20 });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const products = data?.data || [];
  const topProductsWidget = widgetData?.data;
  const categories = (catData?.data || []).filter((c: any) => c.isActive !== false).slice(0, 10);
  const banners: any[] = bannerData?.data ?? [];

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load products.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

  const carouselItems: LuxCarouselItem[] = useMemo(
    () =>
      banners.map((banner) => ({
        id: banner.id,
        imageUrl: banner.imageUrl,
        title: banner.title,
        subtitle: banner.subtitle,
        badge: banner.badgeLabel,
        onPress:
          banner.linkType === 'NONE'
            ? undefined
            : () => {
                if (banner.linkType === 'PRODUCT' && banner.linkId) {
                  navigation.navigate('Categories', {
                    screen: 'ProductDetail',
                    params: { productId: banner.linkId },
                  });
                } else if (banner.linkType === 'CATEGORY' && banner.linkId) {
                  navigation.navigate('Categories', {
                    screen: 'ProductList',
                    params: { categoryId: banner.linkId },
                  });
                }
              },
      })),
    [banners, navigation],
  );

  const handleViewMore = () => {
    if (topProductsWidget?.linkType === 'PRODUCT' && topProductsWidget?.linkId) {
      navigation.navigate('Categories', {
        screen: 'ProductDetail',
        params: { productId: topProductsWidget.linkId },
      });
      return;
    }
    if (topProductsWidget?.linkType === 'CATEGORY' && topProductsWidget?.linkId) {
      navigation.navigate('Categories', {
        screen: 'ProductList',
        params: {
          categoryId: topProductsWidget.linkId,
          categoryName: topProductsWidget?.title,
        },
      });
      return;
    }
    navigation.navigate('Categories', { screen: 'Categories' });
  };

  const ListHeader = () => (
    <>
      {carouselItems.length > 0 ? (
        <MotionReveal delay={10} duration={400} distance={12}>
          <View style={styles.carouselPad}>
            <LuxCarousel items={carouselItems} height={192} peek={false} fullBleed={false} autoPlay />
          </View>
        </MotionReveal>
      ) : null}

      {categories.length > 0 ? (
        <MotionReveal delay={60} duration={380} distance={12}>
          <View style={styles.collectionsHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.collectionsTitle}>Curated Collections</Text>
              <Text style={styles.collectionsSub}>Artisanal hallmarked selections</Text>
            </View>
            <ScalePressable
              onPress={() => navigation.navigate('Categories', { screen: 'Categories' })}
              scaleTo={0.96}
            >
              <Text style={styles.collectionsAll}>View all +</Text>
            </ScalePressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.facetRow}
          >
            {categories.map((item: any, i: number) => {
              const ring = RING[i % RING.length];
              return (
              <ScalePressable
                key={item.id}
                style={styles.facetCard}
                scaleTo={0.98}
                onPress={() =>
                  navigation.navigate('Categories', {
                    screen: 'ProductList',
                    params: { categoryId: item.id, categoryName: item.name },
                  })
                }
              >
                <View style={[styles.facetRing, { backgroundColor: ring }]}>
                  <Image
                    source={getCategoryImageSource(item)}
                    style={styles.facetImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.facetName} numberOfLines={2}>
                  {item.name}
                </Text>
              </ScalePressable>
            );
            })}
          </ScrollView>
        </MotionReveal>
      ) : null}

      <MotionReveal delay={90} duration={320} distance={10}>
        <ScalePressable onPress={handleViewMore} scaleTo={0.98}>
          <LinearGradient
            colors={['#735c00', '#D4AF37']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.b2bBanner}
          >
            <View style={styles.b2bIcon}>
              <Icon source="book-open-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.b2bEyebrow}>Exclusive B2B & Retail</Text>
              <Text style={styles.b2bTitle}>View current catalog</Text>
            </View>
            <View style={styles.b2bArrow}>
              <Icon source="arrow-right" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </ScalePressable>
      </MotionReveal>

      <MotionReveal delay={110} duration={300} distance={8}>
        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search jewelry by weight, purity..."
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              selectionColor={C.gold}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
          <FilterPills value={filter} onChange={setFilter} />
        </View>
      </MotionReveal>
    </>
  );

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <FlatList
        style={styles.listFlex}
        data={products}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 20, 160)} duration={240} distance={8}>
            <View style={styles.productPad}>
              <ProductCard
                variant="editorial"
                item={item}
                onPress={() =>
                  navigation.navigate('Categories', {
                    screen: 'ProductDetail',
                    params: { productId: item.id },
                  })
                }
              />
            </View>
          </MotionReveal>
        )}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listFlex: { flex: 1, backgroundColor: 'transparent' },
  listContent: { paddingBottom: 118 },
  carouselPad: { marginTop: 8, marginBottom: 4, paddingHorizontal: 16 },
  collectionsHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  collectionsTitle: {
    color: C.text,
    fontSize: 24,
    fontFamily: F.serif,
    fontWeight: '500',
  },
  collectionsSub: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: F.sans,
  },
  collectionsAll: {
    color: C.ruby,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: F.sans,
  },
  facetRow: {
    paddingHorizontal: PAD,
    gap: 16,
    paddingBottom: 8,
  },
  facetCard: {
    width: 88,
    alignItems: 'center',
  },
  facetRing: {
    padding: 3,
    borderRadius: 40,
  },
  facetImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surface2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  facetName: {
    color: C.text,
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    width: 88,
  },
  b2bBanner: {
    marginHorizontal: PAD,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: R.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...E.softShadow,
  },
  b2bIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  b2bEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  b2bTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    fontFamily: F.serif,
  },
  b2bArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    paddingHorizontal: PAD,
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.pill,
    paddingHorizontal: 14,
    ...E.softShadow,
  },
  searchIcon: { color: C.textMuted, fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    paddingVertical: 12,
    fontFamily: F.sans,
  },
  productPad: {
    paddingHorizontal: PAD,
    marginBottom: 16,
  },
});
