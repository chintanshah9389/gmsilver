import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useProductsQuery, useCategoriesQuery } from '@/store/services/productsApi';
import { useBannersQuery } from '@/store/services/bannersApi';
import { useTopProductsWidgetQuery } from '@/store/services/homeWidgetsApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import LuxCarousel, { LuxCarouselItem } from '@/components/LuxCarousel';
import ProductCard, { PRODUCT_GRID } from '@/components/ProductCard';
import SectionHeader from '@/components/SectionHeader';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';

const { PAD, GAP } = PRODUCT_GRID;
const { width: SW } = Dimensions.get('window');
const FACET_W = Math.min(148, SW * 0.38);

const FACET_COLORS: [string, string][] = [
  [C.facetA, C.facetC],
  [C.facetB, C.facetA],
  [C.facetC, C.facetB],
  [C.facetD, C.facetA],
];

export default function HomeScreen({ navigation }: any) {
  const { data, error, isError } = useProductsQuery({ page: 1, limit: 8 });
  const { data: widgetData } = useTopProductsWidgetQuery();
  const { data: bannerData } = useBannersQuery();
  const { data: catData } = useCategoriesQuery({ page: 1, limit: 20 });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const products = data?.data || [];
  const topProductsWidget = widgetData?.data;
  const sectionTitle = topProductsWidget?.title || 'Featured pieces';
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

  const ListHeader = () => (
    <>
      {/* Banner slider on top */}
      {carouselItems.length > 0 ? (
        <MotionReveal delay={10} duration={400} distance={12}>
          <View style={styles.carouselPad}>
            <LuxCarousel items={carouselItems} height={220} peek autoPlay />
          </View>
        </MotionReveal>
      ) : null}

      {/* Collections */}
      {categories.length > 0 ? (
        <MotionReveal delay={60} duration={380} distance={12}>
          <View style={styles.collectionsHead}>
            <Text style={styles.collectionsTitle}>Collections</Text>
            <ScalePressable onPress={() => navigation.navigate('Categories')} scaleTo={0.96}>
              <Text style={styles.collectionsAll}>View all</Text>
            </ScalePressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.facetRow}
          >
            {categories.map((item: any, i: number) => {
              const colors = FACET_COLORS[i % FACET_COLORS.length];
              return (
                <ScalePressable
                  key={item.id}
                  style={styles.facetCard}
                  scaleTo={0.97}
                  onPress={() =>
                    navigation.navigate('Categories', {
                      screen: 'ProductList',
                      params: { categoryId: item.id, categoryName: item.name },
                    })
                  }
                >
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.facetGrad}
                  >
                    <View style={styles.facetShine} />
                    <Text style={styles.facetName} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </LinearGradient>
                </ScalePressable>
              );
            })}
          </ScrollView>
        </MotionReveal>
      ) : null}

      {/* Products */}
      <MotionReveal delay={100} duration={320} distance={10}>
        <SectionHeader
          title={sectionTitle}
          subtitle="Handpicked from the atelier"
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
  listContent: { paddingBottom: 118 },
  carouselPad: { marginTop: 4, marginBottom: 8 },
  collectionsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  collectionsTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },
  collectionsAll: {
    color: C.goldDim,
    fontSize: 13,
    fontWeight: '700',
  },
  facetRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  facetCard: {
    width: FACET_W,
    height: 96,
    borderRadius: R.md,
    overflow: 'hidden',
    ...E.softShadow,
  },
  facetGrad: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
  },
  facetShine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderBottomLeftRadius: 20,
  },
  facetName: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  row: {
    paddingHorizontal: PAD,
    gap: GAP,
    marginBottom: GAP,
  },
});
