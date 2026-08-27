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
import { useAddToCartMutation, useCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation } from '@/store/services/cartApi';
import {
  useWishlistQuery,
  useAddWishlistMutation,
  useRemoveWishlistMutation,
} from '@/store/services/wishlistApi';
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
  const { data: cartData } = useCartQuery();
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();
  const [updateCartItem, { isLoading: updatingCart }] = useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: removingCart }] = useRemoveCartItemMutation();
  const { data: wishlistData } = useWishlistQuery();
  const [addWishlist, { isLoading: addingWish }] = useAddWishlistMutation();
  const [removeWishlist, { isLoading: removingWish }] = useRemoveWishlistMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackbarVisible] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [cartUnit, setCartUnit] = useState<CartUnit>('PIECES');
  const [cartAmount, setCartAmount] = useState('1');
  const product = data?.data;
  const inStock = product?.isAvailable !== false;
  const wishlistItems: any[] = wishlistData?.data || [];
  const wished = wishlistItems.some((item) => item.productId === productId);
  const wishBusy = addingWish || removingWish;
  const cartBusy = addingCart || updatingCart || removingCart;

  const cartLine = useMemo(() => {
    const items: any[] = cartData?.data?.items || [];
    return items.find((item) => item.productId === productId) || null;
  }, [cartData, productId]);
  const cartLineQty = Number(cartLine?.quantity || 0);
  const cartLineUnit = cartLine?.unit === 'KG' ? 'KG' : 'PIECES';
  const cartLineUnitAmount = Number(cartLine?.unitAmount || cartLineQty || 0);

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
    if (product?.isAvailable === false) {
      showSnack('This product is out of stock.');
      return;
    }
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
          : 'Enter a valid quantity.',
      );
      return;
    }

    try {
      await addToCart({
        productId,
        quantity: pieceQuantity,
        unit: cartUnit,
        unitAmount: parsedAmount,
      }).unwrap();
      setCartSheetOpen(false);
      showSnack(
        cartUnit === 'KG'
          ? `Added ${parsedAmount} kg (~${pieceQuantity} pcs) to cart`
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

  const changeCartQty = async (delta: number) => {
    try {
      if (cartLineUnit === 'KG') {
        const weightGrams = Number(product?.weight || 0);
        const nextAmount = Math.max(
          0.1,
          Math.round((cartLineUnitAmount + delta * 0.1) * 10) / 10,
        );
        const nextQty =
          weightGrams > 0
            ? Math.max(1, Math.round((nextAmount * 1000) / weightGrams))
            : Math.max(1, cartLineQty + delta);

        if (delta < 0 && cartLineUnitAmount <= 0.1) {
          await removeCartItem(productId).unwrap();
          showSnack('Removed from cart');
          return;
        }

        await updateCartItem({
          productId,
          quantity: nextQty,
          unit: 'KG',
          unitAmount: nextAmount,
        }).unwrap();
        return;
      }

      const nextQty = cartLineQty + delta;
      if (nextQty < 1) {
        await removeCartItem(productId).unwrap();
        showSnack('Removed from cart');
        return;
      }
      await updateCartItem({
        productId,
        quantity: nextQty,
        unit: 'PIECES',
      }).unwrap();
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed to update cart.'));
    }
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
      message: `${product.name}\nGM Silver Catalog`,
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
          <Text style={s.productName}>{product.name}</Text>

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
            {product.origin ? (
              <View style={s.spec}>
                <Text style={s.specVal}>
                  {product.origin === 'IMPORTED' ? 'Imported' : 'Indian'}
                </Text>
                <Text style={s.specKey}>Origin</Text>
              </View>
            ) : null}
            {product.quantity != null ? (
              <View style={s.spec}>
                <Text style={s.specVal}>{inStock ? product.quantity : '—'}</Text>
                <Text style={s.specKey}>{inStock ? 'In Stock' : 'Out of Stock'}</Text>
              </View>
            ) : !inStock ? (
              <View style={s.spec}>
                <Text style={s.specVal}>—</Text>
                <Text style={s.specKey}>Out of Stock</Text>
              </View>
            ) : null}
          </View>
        </MotionReveal>
      </ScrollView>

      <View style={[s.actionBar, { marginBottom: tabClearance }]}>
        <ScalePressable
          style={[s.wishBtn, wished && s.wishBtnActive]}
          scaleTo={0.95}
          disabled={wishBusy}
          onPress={async () => {
            try {
              if (wished) {
                await removeWishlist(productId).unwrap();
                showSnack('Removed from wishlist');
              } else {
                await addWishlist(productId).unwrap();
                showSnack('Added to wishlist');
              }
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

        {inStock ? (
          cartLineQty > 0 ? (
            <View style={s.qtyStepper}>
              <ScalePressable
                style={s.stepperBtn}
                scaleTo={0.92}
                disabled={cartBusy}
                onPress={() => changeCartQty(-1)}
              >
                <Icon
                  source={
                    cartLineUnit === 'KG'
                      ? cartLineUnitAmount <= 0.1
                        ? 'delete-outline'
                        : 'minus'
                      : cartLineQty <= 1
                        ? 'delete-outline'
                        : 'minus'
                  }
                  size={20}
                  color={C.text}
                />
              </ScalePressable>
              <Text style={s.stepperQty}>
                {cartLineUnit === 'KG' ? `${cartLineUnitAmount} kg` : cartLineQty}
              </Text>
              <ScalePressable
                style={s.stepperBtn}
                scaleTo={0.92}
                disabled={cartBusy}
                onPress={() => changeCartQty(1)}
              >
                <Icon source="plus" size={20} color={C.text} />
              </ScalePressable>
            </View>
          ) : (
            <ScalePressable style={s.cartBtn} scaleTo={0.97} onPress={openCartSheet}>
              <View style={s.cartBtnInner}>
                <Icon source="cart-outline" size={18} color="#fff" />
                <Text style={s.cartBtnText}>Add to Bag</Text>
              </View>
            </ScalePressable>
          )
        ) : (
          <View style={[s.cartBtn, s.outOfStockBtn]}>
            <View style={s.cartBtnInner}>
              <Icon source="package-variant-closed" size={18} color={C.textMuted} />
              <Text style={[s.cartBtnText, s.outOfStockText]}>Out of Stock</Text>
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={cartSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeCartSheet}
      >
        <View style={s.sheetRoot}>
          {/* Flex backdrop (not absoluteFill) so web hits sheet controls, not the dimmer */}
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
                  ? `≈ ${pieceQuantity} pcs · ${weightGrams}g each`
                  : 'Weight not set for this product. Switch to Pieces.'}
              </Text>
            ) : (
              <Text style={s.convertHint}>
                {pieceQuantity} piece{pieceQuantity === 1 ? '' : 's'}
              </Text>
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
    borderRadius: R.pill,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: C.ruby,
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
  productName: {
    color: C.text,
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: '500',
    lineHeight: 32,
    letterSpacing: -0.2,
  },
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  wishBtnActive: {
    borderColor: C.ruby,
    backgroundColor: C.accentSoft,
  },
  cartBtn: {
    width: CART_BTN_W,
    height: CART_BTN_H,
    borderRadius: 0,
    backgroundColor: C.ruby,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepper: {
    width: CART_BTN_W,
    height: CART_BTN_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.ruby,
    paddingHorizontal: 6,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'center',
  },
  outOfStockBtn: {
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.borderHi,
  },
  cartBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  outOfStockText: {
    color: C.textMuted,
  },

  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
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
    elevation: 8,
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
    backgroundColor: C.goldSoft,
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
    fontWeight: '700',
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
    backgroundColor: C.primary,
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
