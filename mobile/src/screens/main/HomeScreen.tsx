import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
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
import { getCategoryImageSource } from '@/lib/category-image';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';

const { PAD } = PRODUCT_GRID;
const { width: SW } = Dimensions.get('window');
const COLLECT_W = Math.min(168, SW * 0.42);

export default function HomeScreen({ navigation }: any) {
  const { data, error, isError } = useProductsQuery({ page: 1, limit: 8 });
  const { data: widgetData } = useTopProductsWidgetQuery();
  const { data: bannerData } = useBannersQuery();
  const { data: catData } = useCategoriesQuery({ page: 1, limit: 20 });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const products = data?.data || [];
  const topProductsWidget = widgetData?.data;
  const sectionTitle = topProductsWidget?.title || 'Handpicked from the Atelier';
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
          categoryName: sectionTitle,
        },
      });
      return;
    }
    navigation.navigate('Categories');
  };

  const ListHeader = () => (
    <>
      {carouselItems.length > 0 ? (
        <MotionReveal delay={10} duration={400} distance={12}>
          <View style={styles.carouselPad}>
            <LuxCarousel items={carouselItems} height={300} peek={false} fullBleed autoPlay />
          </View>
        </MotionReveal>
      ) : null}

      {categories.length > 0 ? (
        <MotionReveal delay={60} duration={380} distance={12}>
          <View style={styles.collectionsHead}>
            <Text style={styles.collectionsTitle}>Curated Collections</Text>
            <ScalePressable onPress={() => navigation.navigate('Categories')} scaleTo={0.96}>
              <Text style={styles.collectionsAll}>View all →</Text>
            </ScalePressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.facetRow}
          >
            {categories.map((item: any) => (
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
                <Image
                  source={getCategoryImageSource(item)}
                  style={styles.facetImg}
                  resizeMode="cover"
                />
                <View style={styles.facetLabelRow}>
                  <Text style={styles.facetName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.facetArrow}>→</Text>
                </View>
              </ScalePressable>
            ))}
          </ScrollView>
        </MotionReveal>
      ) : null}

      <MotionReveal delay={100} duration={320} distance={10}>
        <SectionHeader
          title={sectionTitle}
          subtitle="Featured pieces"
          actionLabel="View current catalog"
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
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  listFlex: { flex: 1 },
  listContent: { paddingBottom: 118 },
  carouselPad: { marginTop: 0, marginBottom: 4 },
  collectionsHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  collectionsTitle: {
    color: C.text,
    fontSize: 26,
    fontFamily: F.serif,
    fontWeight: '500',
  },
  collectionsAll: {
    color: C.textSub,
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: 4,
    fontFamily: F.sans,
  },
  facetRow: {
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 8,
  },
  facetCard: {
    width: COLLECT_W,
  },
  facetImg: {
    width: COLLECT_W,
    height: COLLECT_W * 1.2,
    backgroundColor: C.bg2,
    borderRadius: 4,
  },
  facetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  facetName: {
    color: C.text,
    fontSize: 13,
    fontFamily: F.serif,
    flex: 1,
    marginRight: 8,
  },
  facetArrow: {
    color: C.textMuted,
    fontSize: 13,
  },
  productPad: {
    paddingHorizontal: PAD,
    marginBottom: 22,
  },
});
