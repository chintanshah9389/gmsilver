import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Card, Snackbar, Text } from 'react-native-paper';
import { useProductsQuery } from '@/store/services/productsApi';
import { useBannersQuery } from '@/store/services/bannersApi';
import { useTopProductsWidgetQuery } from '@/store/services/homeWidgetsApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 180;
const AUTO_SCROLL_MS = 3500;

const BADGE_COLORS: Record<string, string> = {
  NEW: '#66B7A3',
  SALE: '#C97D8A',
  MARKETING: '#8C78B8',
  FEATURED: '#D8C29A',
};

function BannerCarousel({ navigation }: { navigation: any }) {
  const { data } = useBannersQuery();
  const banners: any[] = data?.data ?? [];
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      const next = (activeIndexRef.current + 1) % banners.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      scrollRef.current?.scrollTo({ x: next * (SCREEN_WIDTH - 24), animated: true });
    }, AUTO_SCROLL_MS);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const handleBannerPress = (banner: any) => {
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
  };

  return (
    <View style={styles.carouselWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 24));
          activeIndexRef.current = idx;
          setActiveIndex(idx);
        }}
      >
        {banners.map((banner) => (
          <ScalePressable
            key={banner.id}
            scaleTo={banner.linkType !== 'NONE' ? 0.985 : 1}
            onPress={() => handleBannerPress(banner)}
            style={styles.slide}
          >
            {banner.imageUrl ? (
              <Image source={{ uri: banner.imageUrl }} style={styles.slideImage} resizeMode="cover" />
            ) : (
              <View style={styles.slidePlaceholder} />
            )}

            <View style={styles.slideOverlay} />

            <View
              style={[
                styles.badge,
                { backgroundColor: BADGE_COLORS[banner.badgeLabel] ?? '#6B7280' },
              ]}
            >
              <Text style={styles.badgeText}>{banner.badgeLabel}</Text>
            </View>

            <View style={styles.slideTextBox}>
              <Text style={styles.slideTitle} numberOfLines={1}>
                {banner.title}
              </Text>
              {banner.subtitle ? (
                <Text style={styles.slideSubtitle} numberOfLines={1}>
                  {banner.subtitle}
                </Text>
              ) : null}
            </View>
          </ScalePressable>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { data, error, isError } = useProductsQuery({ page: 1, limit: 5 });
  const { data: widgetData } = useTopProductsWidgetQuery();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const products = data?.data || [];
  const topProductsWidget = widgetData?.data;
  const sectionTitle = topProductsWidget?.title || 'Top Products';

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load products.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

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
      <MotionReveal delay={30} duration={450} distance={20}>
        <View style={styles.heroWrap}>
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>SILVER CATALOG</Text>
            <Text style={styles.heroTitle}>Discover New Arrivals</Text>
            <Text style={styles.heroCaption}>Handpicked collections with refined craftsmanship</Text>
          </View>
        </View>
      </MotionReveal>

      <MotionReveal delay={120} duration={420} distance={16}>
        <BannerCarousel navigation={navigation} />
      </MotionReveal>

      <MotionReveal delay={180} duration={320} distance={10}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            <Text style={styles.sectionSubtitle}>Trending pieces and fast-moving inventory</Text>
          </View>
          <ScalePressable style={styles.viewMoreBtn} scaleTo={0.98} onPress={handleViewMore}>
            <Text style={styles.viewMoreText}>View More</Text>
          </ScalePressable>
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
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 24, 200)} duration={240} distance={9}>
            <ScalePressable
              style={styles.card}
              scaleTo={0.985}
              onPress={() =>
                navigation.navigate('Products', {
                  screen: 'ProductDetail',
                  params: { productId: item.id },
                })
              }
            >
              <Card style={styles.cardInner}>
                <View style={styles.cardShine} />
                <Card.Content>
                  <Text variant="titleMedium" style={styles.title}>
                    {item.name}
                  </Text>
                  <Text style={styles.sub}>
                    ₹{Number(item.price).toLocaleString()}
                  </Text>
                </Card.Content>
              </Card>
            </ScalePressable>
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
  container: { flex: 1, backgroundColor: C.bg, padding: 12 },
  listFlex: { flex: 1 },
  listContent: { paddingBottom: 22 },
  heroWrap: { paddingTop: 14, paddingBottom: 10, paddingHorizontal: 2 },
  heroTop: {
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 1,
    borderColor: C.borderHi,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...E.softShadow,
  },
  heroEyebrow: { color: C.silver, fontSize: 10, fontWeight: '700', letterSpacing: 2.6, marginBottom: 4 },
  heroTitle: { color: C.text, fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  heroCaption: { color: C.textSub, fontSize: 12, marginTop: 4, letterSpacing: 0.2 },

  carouselWrapper: { marginBottom: 14 },
  sectionHeader: {
    marginTop: 4,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: C.border,
    ...E.softShadow,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: { color: C.textSub, fontSize: 12, marginBottom: 12 },
  viewMoreBtn: {
    alignSelf: 'flex-start',
    minWidth: 136,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: C.borderHi,
    ...E.buttonShadow,
  },
  viewMoreText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  slide: {
    width: SCREEN_WIDTH - 24,
    height: CAROUSEL_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...E.cardShadow,
  },
  slideImage: { width: '100%', height: '100%', position: 'absolute' },
  slidePlaceholder: { width: '100%', height: '100%', backgroundColor: C.surface2 },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21,29,40,0.24)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  slideTextBox: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  slideTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  slideSubtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 13, marginTop: 2 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B2BCC8' },
  dotActive: { width: 18, backgroundColor: C.gold },

  card: { marginBottom: 12 },
  cardInner: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    overflow: 'hidden',
    ...E.softShadow,
  },
  cardShine: {
    position: 'absolute',
    top: -22,
    left: -10,
    width: 160,
    height: 46,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.26)',
    transform: [{ rotate: '-12deg' }],
  },
  title: { color: C.text, fontWeight: '700' },
  sub: { color: C.silver, marginTop: 4, fontWeight: '700', letterSpacing: 0.2 },
});
