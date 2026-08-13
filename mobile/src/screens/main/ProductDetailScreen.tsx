import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useProductByIdQuery } from '@/store/services/productsApi';
import { useAddToCartMutation } from '@/store/services/cartApi';
import { useAddWishlistMutation } from '@/store/services/wishlistApi';
import { getErrorMessage } from '@/lib/error-message';
import { C, R } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import LuxCarousel from '@/components/LuxCarousel';
import { getTabBarClearance } from '@/hooks/useHideTabBarOnFocus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const ACTION_PAD = 16;
const WISH_SIZE = 48;
const CART_GAP = 12;
const CART_BTN_H = 48;
const CART_BTN_W = SW - ACTION_PAD * 2 - WISH_SIZE - CART_GAP;

type CartUnit = 'PIECES' | 'KG';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const tabClearance = getTabBarClearance(insets.bottom);
  const { data, error, isError, isLoading } = useProductByIdQuery(productId);
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();
  const [addWishlist, { isLoading: addingWish }] = useAddWishlistMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackbarVisible] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [wished, setWished] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [cartUnit, setCartUnit] = useState<CartUnit>('PIECES');
  const [cartAmount, setCartAmount] = useState('1');
  const product = data?.data;

  const weightGrams = Number(product?.weight || 0);
  const hasWeight = weightGrams > 0;

  const parsedAmount = useMemo(() => {
    const n = Number(cartAmount);
    return Number.isFinite(n) ? n : 0;
  }, [cartAmount]);

  const pieceQuantity = useMemo(() => {
    if (cartUnit === 'PIECES') {
      return Math.max(0, Math.floor(parsedAmount));
    }
    if (!hasWeight) return 0;
    // weight is stored per piece in grams
    return Math.max(0, Math.round((parsedAmount * 1000) / weightGrams));
  }, [cartUnit, parsedAmount, hasWeight, weightGrams]);

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load product.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackbarVisible(true);
  };

  const openCartSheet = () => {
    setCartUnit('PIECES');
    setCartAmount('1');
    setCartSheetOpen(true);
  };

  const closeCartSheet = () => {
    if (addingCart) return;
    setCartSheetOpen(false);
  };

  const confirmAddToCart = async () => {
    if (pieceQuantity < 1) {
      showSnack(
        cartUnit === 'KG' && !hasWeight
          ? 'Product weight is missing, use Pieces.'
          : 'Enter a valid amount.',
      );
      return;
    }

    try {
      await addToCart({ productId, quantity: pieceQuantity }).unwrap();
      setCartSheetOpen(false);
      showSnack(
        cartUnit === 'KG'
          ? `Added ${pieceQuantity} pcs (~${parsedAmount} kg) to cart`
          : `Added ${pieceQuantity} pcs to cart`,
      );
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed.'));
    }
  };

  const bumpAmount = (delta: number) => {
    if (cartUnit === 'PIECES') {
      const next = Math.max(1, Math.floor(parsedAmount || 1) + delta);
      setCartAmount(String(next));
      return;
    }
    const step = 0.1;
    const next = Math.max(0.1, Math.round(((parsedAmount || 0.1) + delta * step) * 10) / 10);
    setCartAmount(String(next));
  };

  if (isLoading) {
    return (
      <View style={s.loader}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={C.silver} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={s.loader}>
        <Text style={s.notFound}>Product not found</Text>
      </View>
    );
  }

  const images = [product.image1Url, product.image2Url, product.image3Url].filter(Boolean);

  const onShare = async () => {
    await Share.share({
      message: `${product.name} - Rs. ${Number(product.price).toLocaleString()}\nGM Silver Catalog`,
    });
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={s.headerOverlay}>
        <ScalePressable style={s.headerBtn} scaleTo={0.95} onPress={() => navigation.goBack()}>
          <Icon source="chevron-left" size={26} color="#fff" />
        </ScalePressable>
        <ScalePressable style={s.headerBtn} scaleTo={0.95} onPress={onShare}>
          <Icon source="share-variant-outline" size={20} color="#fff" />
        </ScalePressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={s.imgWrap}>
          {images.length > 0 ? (
            <LuxCarousel
              items={images.map((img, i) => ({
                id: `img-${i}`,
                imageUrl: img,
              }))}
              height={SW * 0.92}
              peek={false}
              fullBleed
              autoPlay={images.length > 1}
              showDots
              activeIndex={activeImg}
              onIndexChange={setActiveImg}
              borderRadius={0}
            />
          ) : (
            <View style={s.imgPlaceholder}>
              <Text style={s.imgInitial}>{product.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          {images.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.thumbs}
            >
              {images.map((img, i) => (
                <ScalePressable
                  key={`thumb-${i}`}
                  scaleTo={0.95}
                  onPress={() => setActiveImg(i)}
                  style={[s.thumb, i === activeImg && s.thumbActive]}
                >
                  <Image source={{ uri: img }} style={s.thumbImg} resizeMode="cover" />
                </ScalePressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <MotionReveal delay={50} duration={440} distance={18} style={s.content}>
          <View style={s.namePriceRow}>
            <Text style={s.productName}>{product.name}</Text>
            <Text style={s.productPrice}>₹{Number(product.price).toLocaleString()}</Text>
          </View>

          {product.sku ? (
            <View style={s.skuBadge}>
              <Text style={s.skuText}>SKU: {product.sku}</Text>
            </View>
          ) : null}

          <View style={s.divider} />

          {product.description ? (
            <>
              <Text style={s.sectionLabel}>Description</Text>
              <Text style={s.description}>{product.description}</Text>
            </>
          ) : null}

          <View style={s.specsRow}>
            {product.weight ? (
              <View style={s.spec}>
                <Text style={s.specVal}>{product.weight}g</Text>
                <Text style={s.specKey}>Weight</Text>
              </View>
            ) : null}
            {product.quantity != null ? (
              <View style={s.spec}>
                <Text style={s.specVal}>{product.quantity}</Text>
                <Text style={s.specKey}>In Stock</Text>
              </View>
            ) : null}
          </View>
        </MotionReveal>
      </ScrollView>

      <View style={[s.actionBar, { marginBottom: tabClearance }]}>
        <ScalePressable
          style={[s.wishBtn, wished && s.wishBtnActive]}
          scaleTo={0.95}
          disabled={addingWish}
          onPress={async () => {
            try {
              await addWishlist(productId).unwrap();
              setWished(true);
              showSnack('Added to wishlist');
            } catch (e) {
              showSnack(getErrorMessage(e, 'Failed.'));
            }
          }}
        >
          <Icon
            source={wished ? 'heart' : 'heart-outline'}
            size={22}
            color={wished ? C.error : C.textSub}
          />
        </ScalePressable>

        <ScalePressable style={s.cartBtn} scaleTo={0.97} onPress={openCartSheet}>
          <View style={s.cartBtnInner}>
            <Icon source="cart-outline" size={18} color="#fff" />
            <Text style={s.cartBtnText}>Add to Cart</Text>
          </View>
        </ScalePressable>
      </View>

      <Modal
        visible={cartSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeCartSheet}
      >
        <View style={s.sheetRoot}>
          <Pressable style={s.sheetBackdrop} onPress={closeCartSheet} />
          <View style={s.sheetCard}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Add to Cart</Text>
            <Text style={s.sheetSub} numberOfLines={1}>
              {product.name}
            </Text>

            <Text style={s.sheetLabel}>Choose unit</Text>
            <View style={s.unitRow}>
              <View style={s.unitCol}>
                <ScalePressable
                  style={[s.unitBtn, cartUnit === 'PIECES' && s.unitBtnActive]}
                  scaleTo={0.98}
                  onPress={() => {
                    setCartUnit('PIECES');
                    setCartAmount('1');
                  }}
                >
                  <View style={[s.unitIconWrap, cartUnit === 'PIECES' && s.unitIconWrapActive]}>
                    <Icon
                      source="cube-outline"
                      size={20}
                      color={cartUnit === 'PIECES' ? C.text : C.textSub}
                    />
                  </View>
                  <Text style={[s.unitBtnText, cartUnit === 'PIECES' && s.unitBtnTextActive]}>
                    Pieces
                  </Text>
                  <Text style={[s.unitBtnHint, cartUnit === 'PIECES' && s.unitBtnHintActive]}>
                    by count
                  </Text>
                </ScalePressable>
              </View>
              <View style={s.unitCol}>
                <ScalePressable
                  style={[s.unitBtn, cartUnit === 'KG' && s.unitBtnActive]}
                  scaleTo={0.98}
                  onPress={() => {
                    setCartUnit('KG');
                    setCartAmount('0.5');
                  }}
                >
                  <View style={[s.unitIconWrap, cartUnit === 'KG' && s.unitIconWrapActive]}>
                    <Icon
                      source="weight-kilogram"
                      size={20}
                      color={cartUnit === 'KG' ? C.text : C.textSub}
                    />
                  </View>
                  <Text style={[s.unitBtnText, cartUnit === 'KG' && s.unitBtnTextActive]}>
                    Kg
                  </Text>
                  <Text style={[s.unitBtnHint, cartUnit === 'KG' && s.unitBtnHintActive]}>
                    by weight
                  </Text>
                </ScalePressable>
              </View>
            </View>

            <Text style={s.sheetLabel}>
              {cartUnit === 'PIECES' ? 'Quantity (pcs)' : 'Quantity (kg)'}
            </Text>
            <View style={s.qtyRow}>
              <ScalePressable style={s.qtyBtn} scaleTo={0.95} onPress={() => bumpAmount(-1)}>
                <Icon source="minus" size={18} color={C.text} />
              </ScalePressable>
              <TextInput
                style={s.qtyInput}
                value={cartAmount}
                onChangeText={setCartAmount}
                keyboardType={cartUnit === 'PIECES' ? 'number-pad' : 'decimal-pad'}
                selectionColor={C.goldDim}
              />
              <ScalePressable style={s.qtyBtn} scaleTo={0.95} onPress={() => bumpAmount(1)}>
                <Icon source="plus" size={18} color={C.text} />
              </ScalePressable>
            </View>

            {cartUnit === 'KG' ? (
              <Text style={s.convertHint}>
                {hasWeight
                  ? `≈ ${pieceQuantity} pcs  ·  ${weightGrams}g each`
                  : 'Weight not set for this product. Switch to Pieces.'}
              </Text>
            ) : (
              <Text style={s.convertHint}>{pieceQuantity} piece{pieceQuantity === 1 ? '' : 's'}</Text>
            )}

            <ScalePressable
              style={[s.confirmBtn, (addingCart || pieceQuantity < 1) && s.confirmBtnDisabled]}
              scaleTo={0.97}
              disabled={addingCart || pieceQuantity < 1}
              onPress={confirmAddToCart}
            >
              {addingCart ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.confirmBtnText}>
                  Confirm · {pieceQuantity > 0 ? `${pieceQuantity} pcs` : '—'}
                </Text>
              )}
            </ScalePressable>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: C.textSub, fontSize: 15 },

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(28,25,21,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...E.softShadow,
  },

  imgWrap: { width: SW, backgroundColor: C.surface2 },
  imgPlaceholder: {
    width: SW,
    height: SW * 0.92,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgInitial: { color: C.textMuted, fontSize: SW * 0.18, fontWeight: '700' },
  thumbs: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: R.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: C.gold,
  },
  thumbImg: { width: '100%', height: '100%' },

  content: {
    padding: 20,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: R.xl,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...E.softShadow,
  },
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productName: {
    color: C.text,
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  productPrice: { color: C.goldDim, fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  skuBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.surface2,
    borderRadius: R.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  skuText: { color: C.textMuted, fontSize: 11, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  sectionLabel: {
    color: C.goldDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  description: { color: C.textSub, fontSize: 13, lineHeight: 20 },
  specsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  spec: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  specVal: { color: C.text, fontSize: 17, fontWeight: '800' },
  specKey: { color: C.textMuted, fontSize: 11, marginTop: 2 },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ACTION_PAD,
    paddingTop: 12,
    paddingBottom: 12,
    gap: CART_GAP,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.98)',
    zIndex: 20,
    elevation: 8,
  },
  wishBtn: {
    width: WISH_SIZE,
    height: WISH_SIZE,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    ...E.softShadow,
  },
  wishBtnActive: {
    borderColor: 'rgba(196,92,92,0.4)',
    backgroundColor: 'rgba(196,92,92,0.1)',
  },
  cartBtn: {
    width: CART_BTN_W,
    height: CART_BTN_H,
    borderRadius: R.pill,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
    ...E.buttonShadow,
  },
  cartBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31,39,51,0.45)',
  },
  sheetCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: C.borderHi,
    ...E.cardShadow,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.silverLt,
    marginBottom: 14,
  },
  sheetTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sheetSub: {
    color: C.textSub,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },
  sheetLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 20,
  },
  unitCol: {
    flex: 1,
  },
  unitBtn: {
    width: '100%',
    minHeight: 108,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  unitBtnActive: {
    backgroundColor: 'rgba(216,194,154,0.22)',
    borderColor: C.goldDim,
  },
  unitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  unitIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: C.goldDim,
  },
  unitBtnText: {
    color: C.textSub,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  unitBtnTextActive: {
    color: C.text,
  },
  unitBtnHint: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  unitBtnHintActive: {
    color: C.goldDim,
    fontWeight: '600',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderHi,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface2,
    textAlign: 'center',
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 12,
  },
  convertHint: {
    color: C.textMuted,
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
    ...E.buttonShadow,
  },
  confirmBtnDisabled: {
    opacity: 0.55,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
