import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions, Image, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useProductByIdQuery } from '@/store/services/productsApi';
import { useAddToCartMutation } from '@/store/services/cartApi';
import { useAddWishlistMutation } from '@/store/services/wishlistApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

const { width: SW } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { data, error, isError, isLoading } = useProductByIdQuery(productId);
  const [addToCart] = useAddToCartMutation();
  const [addWishlist] = useAddWishlistMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const product = data?.data;

  useEffect(() => {
    if (isError && error) { setSnackMsg(getErrorMessage(error, 'Failed to load product.')); setSnackVisible(true); }
  }, [error, isError]);

  const showSnack = (msg: string) => { setSnackMsg(msg); setSnackVisible(true); };

  if (isLoading) return (
    <View style={s.loader}><StatusBar barStyle="dark-content" /><ActivityIndicator color={C.silver} size="large" /></View>
  );

  if (!product) return (
    <View style={s.loader}><Text style={s.notFound}>Product not found</Text></View>
  );

  const images = [product.image1Url, product.image2Url, product.image3Url].filter(Boolean);

  const onShare = async () => {
    await Share.share({ message: `${product.name} - Rs. ${Number(product.price).toLocaleString()}\nGM Silver Catalog` });
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header overlay */}
      <View style={s.headerOverlay}>
        <ScalePressable style={s.headerBtn} scaleTo={0.95} onPress={() => navigation.goBack()}>
          <Text style={s.headerBtnText}>{'<'}</Text>
        </ScalePressable>
        <ScalePressable style={s.headerBtn} scaleTo={0.95} onPress={onShare}>
          <Text style={s.headerBtnText}>^</Text>
        </ScalePressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Image carousel */}
        <View style={s.imgWrap}>
          {images.length > 0 ? (
            <>
              <ScrollView
                ref={scrollRef}
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / SW))}
              >
                {images.map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={s.imgSlide} resizeMode="cover" />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={s.imgDots}>
                  {images.map((_, i) => <View key={i} style={[s.imgDot, i === activeImg && s.imgDotActive]} />)}
                </View>
              )}
            </>
          ) : (
            <View style={s.imgPlaceholder}>
              <Text style={s.imgInitial}>{product.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <MotionReveal delay={50} duration={440} distance={18} style={s.content}>
          {/* Name + price */}
          <View style={s.namePriceRow}>
            <Text style={s.productName}>{product.name}</Text>
            <Text style={s.productPrice}>Rs. {Number(product.price).toLocaleString()}</Text>
          </View>

          {/* SKU badge */}
          {product.sku && (
            <View style={s.skuBadge}><Text style={s.skuText}>SKU: {product.sku}</Text></View>
          )}

          {/* Divider */}
          <View style={s.divider} />

          {/* Description */}
          {product.description ? (
            <>
              <Text style={s.sectionLabel}>Description</Text>
              <Text style={s.description}>{product.description}</Text>
            </>
          ) : null}

          {/* Specs row */}
          <View style={s.specsRow}>
            {product.weight   && <View style={s.spec}><Text style={s.specVal}>{product.weight}g</Text><Text style={s.specKey}>Weight</Text></View>}
            {product.quantity != null && <View style={s.spec}><Text style={s.specVal}>{product.quantity}</Text><Text style={s.specKey}>In Stock</Text></View>}
          </View>
        </MotionReveal>
      </ScrollView>

      {/* Bottom action bar */}
      <MotionReveal delay={150} duration={360} distance={12}>
        <View style={s.actionBar}>
          <ScalePressable
            style={s.wishBtn}
            scaleTo={0.95}
            onPress={async () => {
              try { await addWishlist(productId).unwrap(); showSnack('Added to wishlist'); }
              catch (e) { showSnack(getErrorMessage(e, 'Failed.')); }
            }}
          >
            <Text style={s.wishIcon}>{'<3'}</Text>
          </ScalePressable>
          <ScalePressable
            style={s.cartBtn}
            scaleTo={0.97}
            onPress={async () => {
              try { await addToCart({ productId, quantity: 1 }).unwrap(); showSnack('Added to cart'); }
              catch (e) { showSnack(getErrorMessage(e, 'Failed.')); }
            }}
          >
            <Text style={s.cartBtnText}>Add to Cart</Text>
          </ScalePressable>
        </View>
      </MotionReveal>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2500}>{snackMsg}</Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: C.textSub, fontSize: 15 },

  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...E.softShadow },
  headerBtnText: { color: '#fff', fontSize: 20, lineHeight: 24 },

  imgWrap: { width: SW, height: SW * 0.85 },
  imgSlide: { width: SW, height: SW * 0.85 },
  imgPlaceholder: { width: SW, height: SW * 0.85, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  imgInitial: { color: C.textMuted, fontSize: SW * 0.18, fontWeight: '700' },
  imgDots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  imgDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  imgDotActive: { width: 20, backgroundColor: C.silver },

  content: { padding: 20 },
  namePriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  productName: { color: C.text, fontSize: 20, fontWeight: '800', flex: 1, lineHeight: 26, letterSpacing: 0.2 },
  productPrice: { color: C.silver, fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  skuBadge: { alignSelf: 'flex-start', backgroundColor: C.surface2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, borderWidth: 1, borderColor: C.border },
  skuText: { color: C.textMuted, fontSize: 11, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  sectionLabel: { color: C.silver, fontSize: 10, fontWeight: '700', letterSpacing: 2.1, marginBottom: 8, textTransform: 'uppercase' },
  description: { color: C.textSub, fontSize: 13, lineHeight: 20 },
  specsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  spec: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, ...E.softShadow },
  specVal: { color: C.text, fontSize: 17, fontWeight: '800' },
  specKey: { color: C.textMuted, fontSize: 11, marginTop: 2 },

  actionBar: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, ...E.cardShadow },
  wishBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface2, ...E.softShadow },
  wishIcon: { fontSize: 22, color: C.silver },
  cartBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: C.silver, alignItems: 'center', justifyContent: 'center', ...E.buttonShadow },
  cartBtnText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});



