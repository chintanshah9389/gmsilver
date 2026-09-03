import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';
import StatusBanners from '@/components/StatusBanners';

const { width: SW } = Dimensions.get('window');
const PAD = 20;
const GAP = 16;
export const PRODUCT_CARD_W = (SW - PAD * 2 - GAP) / 2;

type ProductCardProps = {
  item: {
    id: string;
    name?: string;
    image1Url?: string | null;
    origin?: string;
    isAvailable?: boolean;
  };
  onPress: () => void;
  onWish?: () => void;
  wished?: boolean;
  width?: number;
  variant?: 'grid' | 'editorial';
  ctaLabel?: string;
};

/** List card: image + title only (details live on product page). */
export default function ProductCard({
  item,
  onPress,
  onWish,
  wished,
  width,
  variant = 'editorial',
}: ProductCardProps) {
  const editorial = variant === 'editorial';
  const cardW = width ?? (editorial ? SW - PAD * 2 : PRODUCT_CARD_W);
  const imgH = editorial ? Math.min(208, cardW * 0.68) : cardW * 1.22;
  const outOfStock = item.isAvailable === false;

  return (
    <View style={[s.card, { width: cardW }]}>
      <ScalePressable scaleTo={0.99} onPress={onPress}>
        <View style={[s.imgWrap, { height: imgH }]}>
          {item.image1Url ? (
            <Image
              source={{ uri: item.image1Url }}
              style={[s.img, outOfStock && s.imgDimmed]}
              resizeMode="cover"
            />
          ) : (
            <View style={s.imgPlaceholder}>
              <Text style={s.imgInitial}>{item.name?.[0]?.toUpperCase() ?? 'G'}</Text>
            </View>
          )}
          <View style={s.bannerCol}>
            <StatusBanners origin={item.origin} inStock={!outOfStock} />
          </View>
          {outOfStock ? (
            <View style={s.oosBanner}>
              <Text style={s.oosBannerText}>Out of stock</Text>
            </View>
          ) : null}
        </View>
        <View style={s.body}>
          <Text style={s.name} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </ScalePressable>

      {onWish ? (
        <ScalePressable
          style={[s.wishBtn, wished && s.wishBtnActive]}
          scaleTo={0.9}
          onPress={(e) => {
            (e as { stopPropagation?: () => void })?.stopPropagation?.();
            onWish();
          }}
        >
          <Icon
            source={wished ? 'heart' : 'heart-outline'}
            size={16}
            color={wished ? C.ruby : C.textSub}
          />
        </ScalePressable>
      ) : null}
    </View>
  );
}

export const PRODUCT_GRID = { PAD, GAP };

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    position: 'relative',
    ...E.cardShadow,
  },
  imgWrap: {
    width: '100%',
    backgroundColor: C.surface2,
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgDimmed: { opacity: 0.55 },
  bannerCol: {
    position: 'absolute',
    left: 10,
    top: 10,
    right: 48,
    zIndex: 2,
  },
  oosBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#B91C1C',
    paddingVertical: 8,
    alignItems: 'center',
  },
  oosBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface2,
  },
  imgInitial: {
    color: C.textMuted,
    fontSize: 34,
    fontFamily: F.serif,
  },
  wishBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  wishBtnActive: { backgroundColor: '#FFF5F5' },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  name: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: F.serif,
    lineHeight: 20,
  },
});
