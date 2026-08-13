import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useProductsQuery, useCategoriesQuery } from '@/store/services/productsApi';
import { useBannersQuery } from '@/store/services/bannersApi';
import { useTopProductsWidgetQuery } from '@/store/services/homeWidgetsApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import LuxCarousel, { LuxCarouselItem } from '@/components/LuxCarousel';
import ProductCard, { PRODUCT_GRID } from '@/components/ProductCard';
import CategoryChipRow from '@/components/CategoryChip';
import SectionHeader from '@/components/SectionHeader';
import MotionReveal from '@/components/MotionReveal';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';

const { PAD, GAP } = PRODUCT_GRID;

export default function HomeScreen({ navigation }: any) {
  const { data, error, isError } = useProductsQuery({ page: 1, limit: 8 });
  const { data: widgetData } = useTopProductsWidgetQuery();
  const { data: bannerData } = useBannersQuery();
  const { data: catData } = useCategoriesQuery({ page: 1, limit: 20 });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [search, setSearch] = useState('');

  const products = data?.data || [];
  const topProductsWidget = widgetData?.data;
  const sectionTitle = topProductsWidget?.title || 'Curated for you';
  const categories = (catData?.data || []).filter((c: any) => c.isActive !== false).slice(0, 12);
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
                  navigation.navigate('Products', {
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
      navigation.navigate('Products', {
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
          categoryName: sectionTitle,
        },
      });
      return;
    }
    navigation.navigate('Products');
  };

  const onSearchSubmit = () => {
    navigation.navigate('Products', {
      screen: 'ProductList',
      params: search.trim() ? { categoryName: 'Search' } : undefined,
    });
  };

  const ListHeader = () => (
    <>
      <MotionReveal delay={20} duration={400} distance={16}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>FINE SILVER</Text>
          <Text style={styles.heroTitle}>Discover timeless pieces</Text>
        </View>
      </MotionReveal>

      {carouselItems.length > 0 ? (
        <MotionReveal delay={60} duration={420} distance={14}>
          <View style={styles.carouselPad}>
            <LuxCarousel items={carouselItems} height={220} peek autoPlay />
          </View>
        </MotionReveal>
      ) : null}

      <MotionReveal delay={100} duration={360} distance={12}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jewelry…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
            selectionColor={C.gold}
          />
        </View>
      </MotionReveal>

      <MotionReveal delay={130} duration={340} distance={10}>
        <CategoryChipRow
          items={categories}
          onSelect={(item) =>
            navigation.navigate('Categories', {
              screen: 'ProductList',
              params: { categoryId: item.id, categoryName: item.name },
            })
          }
          onSeeAll={() => navigation.navigate('Categories')}
        />
      </MotionReveal>

      <MotionReveal delay={160} duration={300} distance={8}>
        <SectionHeader
          title={sectionTitle}
          subtitle="Trending pieces from the catalog"
          onAction={handleViewMore}
        />
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
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 20, 160)} duration={240} distance={8}>
            <ProductCard
              item={item}
              onPress={() =>
                navigation.navigate('Products', {
                  screen: 'ProductDetail',
                  params: { productId: item.id },
                })
              }
            />
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
  listFlex: { flex: 1 },
  listContent: { paddingBottom: 110 },
  heroCopy: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 10,
  },
  heroEyebrow: {
    color: C.goldDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 6,
  },
  heroTitle: {
    color: C.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: C.surface,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    ...E.softShadow,
  },
  searchIcon: { color: C.textMuted, fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    paddingVertical: 12,
  },
  carouselPad: { marginTop: 2, marginBottom: 6 },
  row: {
    paddingHorizontal: PAD,
    gap: GAP,
    marginBottom: GAP,
  },
});
