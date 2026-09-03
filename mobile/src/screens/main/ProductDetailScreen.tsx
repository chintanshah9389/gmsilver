import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useProductByIdQuery } from '@/store/services/productsApi';
import {
  useAddToCartMutation,
  useCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '@/store/services/cartApi';
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
import { useHideTabBarOnFocus } from '@/hooks/useHideTabBarOnFocus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '@/theme/typography';
import StatusBanners from '@/components/StatusBanners';
import ProductSpecs from '@/components/ProductSpecs';

const { width: SW, height: SH } = Dimensions.get('window');
const HERO_H = Math.min(SW * 1.08, SH * 0.52);
const ACTION_PAD = 16;
const WISH_SIZE = 52;
const CART_GAP = 12;
const CART_BTN_H = 52;
const CART_BTN_W = SW - ACTION_PAD * 2 - WISH_SIZE - CART_GAP;
const DESC_PREVIEW = 140;

type CartUnit = 'PIECES' | 'KG';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  useHideTabBarOnFocus();
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
  const [aboutOpen, setAboutOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [skuPulse] = useState(() => new RNAnimated.Value(1));
  const heartScale = useRef(new RNAnimated.Value(1)).current;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_H * 0.45], [0, 1], Extrapolation.CLAMP),
  }));

  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HERO_H],
          [0, HERO_H * 0.22],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

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

  const showSnack = useCallback((msg: string) => {
    setSnackMsg(msg);
    setSnackbarVisible(true);
  }, []);

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
        const w = Number(product?.weight || 0);
        const nextAmount = Math.max(
          0.1,
          Math.round((cartLineUnitAmount + delta * 0.1) * 10) / 10,
        );
        const nextQty =
          w > 0
            ? Math.max(1, Math.round((nextAmount * 1000) / w))
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

  const pulseHeart = () => {
    heartScale.setValue(0.7);
    RNAnimated.spring(heartScale, {
      toValue: 1,
      friction: 3,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const toggleWish = async () => {
    try {
      pulseHeart();
      if (wished) {
        await removeWishlist(productId).unwrap();
        showSnack('Removed from wishlist');
      } else {
        await addWishlist(productId).unwrap();
        showSnack('Saved to wishlist');
      }
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed.'));
    }
  };

  const onSkuPress = () => {
    const sku = String(product?.sku || '').trim();
    if (!sku) return;
    RNAnimated.sequence([
      RNAnimated.timing(skuPulse, {
        toValue: 0.94,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.spring(skuPulse, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
    Share.share({ message: sku, title: 'Product SKU' }).catch(() => {
      showSnack(`SKU · ${sku}`);
    });
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

  const images = [product.image1Url, product.image2Url, product.image3Url].filter(Boolean) as string[];
  const description = String(product.description || '').trim();
  const descLong = description.length > DESC_PREVIEW;
  const descShown =
    aboutOpen || !descLong ? description : `${description.slice(0, DESC_PREVIEW).trim()}…`;

  const onShare = async () => {
    await Share.share({
      message: `${product.name}${product.sku ? `\nSKU: ${product.sku}` : ''}\nGM Silver Catalog`,
    });
  };

  const openLightbox = (index?: number) => {
    if (!images.length) return;
    if (typeof index === 'number') setActiveImg(index);
    setLightboxOpen(true);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Scroll-linked solid header */}
      <Animated.View
        pointerEvents="none"
        style={[s.headerSolid, { height: insets.top + 56 }, headerBgStyle]}
      />

      <View style={[s.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <ScalePressable style={s.headerBtn} scaleTo={0.92} onPress={() => navigation.goBack()}>
          <Icon source="chevron-left" size={26} color="#fff" />
        </ScalePressable>
        <View style={s.headerRight}>
          <ScalePressable style={s.headerBtn} scaleTo={0.92} onPress={onShare}>
            <Icon source="share-variant-outline" size={18} color="#fff" />
          </ScalePressable>
          <ScalePressable
            style={[s.headerBtn, wished && s.headerWishActive]}
            scaleTo={0.9}
            disabled={wishBusy}
            onPress={toggleWish}
          >
            <RNAnimated.View style={{ transform: [{ scale: heartScale }] }}>
              <Icon
                source={wished ? 'heart' : 'heart-outline'}
                size={18}
                color={wished ? '#FF6B7A' : '#fff'}
              />
            </RNAnimated.View>
          </ScalePressable>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={[s.imgWrap, { height: HERO_H }]}>
          <Animated.View style={[s.heroInner, heroParallaxStyle]}>
            {images.length > 0 ? (
              <LuxCarousel
                items={images.map((img, i) => ({
                  id: `img-${i}`,
                  imageUrl: img,
                  onPress: () => openLightbox(i),
                }))}
                height={HERO_H}
                peek={false}
                fullBleed
                autoPlay={images.length > 1}
                showDots={false}
                activeIndex={activeImg}
                onIndexChange={setActiveImg}
                borderRadius={0}
              />
            ) : (
              <View style={[s.imgPlaceholder, { height: HERO_H }]}>
                <Text style={s.imgInitial}>{product.name?.[0]?.toUpperCase()}</Text>
              </View>
            )}
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(26,24,25,0.35)', 'rgba(26,24,25,0.55)']}
            style={s.heroFade}
            pointerEvents="none"
          />

          {images.length > 0 ? (
            <View style={s.imgMeta} pointerEvents="box-none">
              <ScalePressable style={s.zoomChip} scaleTo={0.94} onPress={() => openLightbox()}>
                <Icon source="magnify-plus-outline" size={16} color="#fff" />
                <Text style={s.zoomChipText}>View</Text>
              </ScalePressable>
              {images.length > 1 ? (
                <View style={s.counterChip}>
                  <Text style={s.counterText}>
                    {activeImg + 1} / {images.length}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {!inStock ? (
            <View style={s.oosBar} pointerEvents="none">
              <Text style={s.oosBarText}>Out of stock</Text>
            </View>
          ) : null}
        </View>

        <View style={s.content}>
          <View style={s.sheetPull} />

          <MotionReveal delay={30} duration={380} distance={14}>
            <View style={s.statusRow}>
              <StatusBanners origin={product.origin} inStock={inStock} variant="soft" />
            </View>
          </MotionReveal>

          <MotionReveal delay={80} duration={400} distance={16}>
            {product.category?.name ? (
              <Text style={s.category}>{product.category.name}</Text>
            ) : null}
            <Text style={s.productName}>{product.name}</Text>
          </MotionReveal>

          {product.sku ? (
            <MotionReveal delay={120} duration={400} distance={12}>
              <RNAnimated.View style={{ transform: [{ scale: skuPulse }] }}>
                <ScalePressable style={s.skuBadge} scaleTo={0.97} onPress={onSkuPress}>
                  <View style={s.skuDot} />
                  <Text style={s.skuBadgeLabel}>SKU</Text>
                  <Text style={s.skuBadgeValue}>{String(product.sku).trim()}</Text>
                  <Icon source="share-outline" size={14} color={C.goldDim} />
                </ScalePressable>
              </RNAnimated.View>
            </MotionReveal>
          ) : null}

          {images.length > 1 ? (
            <MotionReveal delay={150} duration={400} distance={12}>
              <View style={s.thumbsBlock}>
                <Text style={s.thumbsLabel}>Gallery</Text>
                <Animated.ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.thumbs}
                >
                  {images.map((img, i) => (
                    <ScalePressable
                      key={`thumb-${i}`}
                      scaleTo={0.92}
                      onPress={() => setActiveImg(i)}
                      onLongPress={() => openLightbox(i)}
                      style={[s.thumb, i === activeImg && s.thumbActive]}
                    >
                      <Image source={{ uri: img }} style={s.thumbImg} resizeMode="cover" />
                      {i === activeImg ? <View style={s.thumbGlow} /> : null}
                    </ScalePressable>
                  ))}
                </Animated.ScrollView>
              </View>
            </MotionReveal>
          ) : null}

          <MotionReveal delay={180} duration={420} distance={14}>
            <ProductSpecs purity={product.purity} weight={product.weight} />
          </MotionReveal>

          {description ? (
            <MotionReveal delay={220} duration={420} distance={14}>
              <View style={s.aboutBlock}>
                <Pressable
                  style={s.aboutHeader}
                  onPress={() => descLong && setAboutOpen((v) => !v)}
                >
                  <Text style={s.aboutLabel}>About this piece</Text>
                  {descLong ? (
                    <Icon
                      source={aboutOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={C.textMuted}
                    />
                  ) : null}
                </Pressable>
                <Text style={s.description}>{descShown}</Text>
                {descLong ? (
                  <ScalePressable
                    scaleTo={0.97}
                    onPress={() => setAboutOpen((v) => !v)}
                    style={s.readMoreBtn}
                  >
                    <Text style={s.readMoreText}>{aboutOpen ? 'Show less' : 'Read more'}</Text>
                  </ScalePressable>
                ) : null}
              </View>
            </MotionReveal>
          ) : null}

          {inStock && cartLineQty === 0 ? (
            <MotionReveal delay={260} duration={400} distance={12}>
              <ScalePressable style={s.quickAdd} scaleTo={0.98} onPress={openCartSheet}>
                <Icon source="lightning-bolt" size={18} color={C.ruby} />
                <Text style={s.quickAddText}>Quick add to bag</Text>
                <Icon source="chevron-right" size={18} color={C.textMuted} />
              </ScalePressable>
            </MotionReveal>
          ) : null}
        </View>
      </Animated.ScrollView>

      <View style={[s.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <ScalePressable
          style={[s.wishBtn, wished && s.wishBtnActive]}
          scaleTo={0.92}
          disabled={wishBusy}
          onPress={toggleWish}
        >
          <RNAnimated.View style={{ transform: [{ scale: heartScale }] }}>
            <Icon
              source={wished ? 'heart' : 'heart-outline'}
              size={22}
              color={wished ? C.error : C.textSub}
            />
          </RNAnimated.View>
        </ScalePressable>

        {inStock ? (
          cartLineQty > 0 ? (
            <View style={s.inCartRow}>
              <View style={s.qtyStepper}>
                <ScalePressable
                  style={s.stepperBtn}
                  scaleTo={0.9}
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
                  scaleTo={0.9}
                  disabled={cartBusy}
                  onPress={() => changeCartQty(1)}
                >
                  <Icon source="plus" size={20} color={C.text} />
                </ScalePressable>
              </View>
              <ScalePressable
                style={s.viewCartBtn}
                scaleTo={0.96}
                onPress={() => navigation.navigate('Cart')}
              >
                <Icon source="cart-outline" size={16} color="#fff" />
                <Text style={s.viewCartText}>View Cart</Text>
              </ScalePressable>
            </View>
          ) : (
            <ScalePressable style={s.cartBtn} scaleTo={0.97} onPress={openCartSheet}>
              <View style={s.cartBtnInner} pointerEvents="none">
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

      {/* Fullscreen gallery lightbox */}
      <Modal
        visible={lightboxOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxOpen(false)}
      >
        <View style={s.lightboxRoot}>
          <Pressable style={s.lightboxBackdrop} onPress={() => setLightboxOpen(false)} />
          <View style={[s.lightboxTop, { paddingTop: insets.top + 8 }]}>
            <Text style={s.lightboxCount}>
              {images.length ? `${activeImg + 1} / ${images.length}` : ''}
            </Text>
            <ScalePressable
              style={s.lightboxClose}
              scaleTo={0.92}
              onPress={() => setLightboxOpen(false)}
            >
              <Icon source="close" size={22} color="#fff" />
            </ScalePressable>
          </View>
          {images.length > 0 ? (
            <LuxCarousel
              items={images.map((img, i) => ({
                id: `lb-${i}`,
                imageUrl: img,
              }))}
              height={SH * 0.62}
              peek={false}
              fullBleed
              autoPlay={false}
              showDots
              activeIndex={activeImg}
              onIndexChange={setActiveImg}
              borderRadius={0}
            />
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={cartSheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeCartSheet}
      >
        <View style={s.sheetRoot}>
          <Pressable style={s.sheetBackdrop} onPress={closeCartSheet} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            pointerEvents="box-none"
          >
            <View style={[s.sheetCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Add to Bag</Text>
              <Text style={s.sheetSub} numberOfLines={1}>
                {product.name}
              </Text>

              <Text style={s.sheetLabel}>Choose unit</Text>
              <View style={s.unitRow}>
                <View style={s.unitCol}>
                  <ScalePressable
                    scaleTo={0.97}
                    style={[s.unitBtn, cartUnit === 'PIECES' && s.unitBtnActive]}
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
                    scaleTo={0.97}
                    style={[s.unitBtn, cartUnit === 'KG' && s.unitBtnActive]}
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
                <ScalePressable style={s.qtyBtn} scaleTo={0.9} onPress={() => bumpAmount(-1)}>
                  <Icon source="minus" size={18} color={C.text} />
                </ScalePressable>
                <TextInput
                  style={s.qtyInput}
                  value={cartAmount}
                  onChangeText={setCartAmount}
                  keyboardType={cartUnit === 'PIECES' ? 'number-pad' : 'decimal-pad'}
                  selectionColor={C.goldDim}
                />
                <ScalePressable style={s.qtyBtn} scaleTo={0.9} onPress={() => bumpAmount(1)}>
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
                  <View style={s.confirmInner} pointerEvents="none">
                    <Icon source="shopping-outline" size={18} color="#fff" />
                    <Text style={s.confirmBtnText}>
                      Confirm — {cartUnit === 'KG' ? `${parsedAmount} kg` : `${pieceQuantity} pcs`}
                    </Text>
                  </View>
                )}
              </ScalePressable>
            </View>
          </KeyboardAvoidingView>
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

  headerSolid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(28,25,21,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...E.softShadow,
  },
  headerWishActive: {
    backgroundColor: 'rgba(187,0,39,0.55)',
    borderColor: 'rgba(255,150,160,0.45)',
  },

  imgWrap: {
    width: SW,
    backgroundColor: C.bg2,
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: {
    width: SW,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    zIndex: 2,
  },
  imgMeta: {
    position: 'absolute',
    right: 16,
    bottom: 36,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: 'rgba(26,24,25,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zoomChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  counterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: 'rgba(26,24,25,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: F.sans,
  },
  oosBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    backgroundColor: 'rgba(185,28,28,0.92)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    zIndex: 4,
  },
  oosBarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  imgPlaceholder: {
    width: '100%',
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgInitial: { color: C.textMuted, fontSize: SW * 0.18, fontWeight: '700' },

  content: {
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.border,
    minHeight: SH * 0.42,
    ...E.softShadow,
  },
  sheetPull: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderHi,
    marginBottom: 18,
  },
  statusRow: { marginBottom: 12 },
  category: {
    color: C.goldDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: F.sans,
  },
  productName: {
    color: C.text,
    fontSize: 28,
    fontFamily: F.serif,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  skuBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: R.pill,
    backgroundColor: C.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(156,121,72,0.4)',
  },
  skuDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.gold,
  },
  skuBadgeLabel: {
    color: C.goldDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: F.sans,
  },
  skuBadgeValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.35,
    fontFamily: F.sans,
    flexShrink: 1,
  },

  thumbsBlock: { marginBottom: 18 },
  thumbsLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: F.sans,
  },
  thumbs: { gap: 10, paddingRight: 8 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.surface2,
  },
  thumbActive: { borderColor: C.ruby },
  thumbImg: { width: '100%', height: '100%' },
  thumbGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    backgroundColor: 'rgba(187,0,39,0.08)',
  },

  aboutBlock: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aboutLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  description: {
    color: C.textSub,
    fontSize: 14,
    lineHeight: 23,
    fontFamily: F.sans,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  readMoreText: {
    color: C.ruby,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: F.sans,
  },

  quickAdd: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: R.lg,
    backgroundColor: C.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(187,0,39,0.15)',
  },
  quickAddText: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: F.sans,
  },

  confirmInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ACTION_PAD,
    paddingTop: 12,
    gap: CART_GAP,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.98)',
    zIndex: 20,
    ...E.floatShadow,
  },
  wishBtn: {
    width: WISH_SIZE,
    height: WISH_SIZE,
    borderRadius: R.pill,
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
    borderRadius: R.lg,
    backgroundColor: C.ruby,
    alignItems: 'center',
    justifyContent: 'center',
    ...E.buttonShadow,
  },
  inCartRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: CART_BTN_H,
  },
  qtyStepper: {
    flex: 1,
    height: CART_BTN_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.ruby,
    borderRadius: R.lg,
    paddingHorizontal: 4,
  },
  viewCartBtn: {
    height: CART_BTN_H,
    paddingHorizontal: 14,
    borderRadius: R.lg,
    backgroundColor: C.ruby,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: F.sans,
  },
  stepperBtn: {
    width: 42,
    height: 42,
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
  outOfStockText: { color: C.textMuted },

  lightboxRoot: {
    flex: 1,
    backgroundColor: 'rgba(10,9,9,0.94)',
    justifyContent: 'center',
  },
  lightboxBackdrop: { ...StyleSheet.absoluteFillObject },
  lightboxTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  lightboxCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  lightboxClose: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,24,25,0.55)',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: C.borderHi,
    zIndex: 2,
    ...E.cardShadow,
    elevation: 24,
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: F.serif,
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
  unitCol: { flex: 1 },
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
  unitBtnTextActive: { color: C.text },
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
    height: 52,
    borderRadius: 999,
    backgroundColor: C.ruby,
    alignItems: 'center',
    justifyContent: 'center',
    ...E.buttonShadow,
  },
  confirmBtnDisabled: { opacity: 0.55 },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
