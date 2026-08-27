import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';

const { width: SW } = Dimensions.get('window');
const PAD = 24;
const GAP = 16;
export const PRODUCT_CARD_W = (SW - PAD * 2 - GAP) / 2;

type ProductCardProps = {
  item: {
    id: string;
    name?: string;
    price?: number | string;
    image1Url?: string | null;
    sku?: string;
    isAvailable?: boolean;
  };
  onPress: () => void;
  onWish?: () => void;
  wished?: boolean;
  width?: number;
  variant?: 'grid' | 'editorial';
};

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
  const imgH = editorial ? cardW * 1.05 : cardW * 1.22;
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
          {outOfStock ? (
            <View style={s.oosBadge}>
              <Text style={s.oosBadgeText}>Out of Stock</Text>
            </View>
          ) : null}
        </View>
        <View style={s.body}>
          <Text style={s.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={s.price}>₹{Number(item.price || 0).toLocaleString()}</Text>
        </View>
      </ScalePressable>

      {onWish ? (
        <ScalePressable
          style={[s.wishBtn, wished && s.wishBtnActive]}
          scaleTo={0.9}
          onPress={(e) => {
            // Web: keep heart tap from also opening the product.
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
    backgroundColor: 'transparent',
    position: 'relative',
  },
  imgWrap: {
    width: '100%',
    backgroundColor: C.bg2,
    borderRadius: R.xs,
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgDimmed: { opacity: 0.55 },
  oosBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(27,28,26,0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.xs,
  },
  oosBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg2,
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
  body: { paddingTop: 12, paddingBottom: 6 },
  name: {
    color: C.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: F.sans,
    lineHeight: 18,
  },
  price: {
    color: C.ruby,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    fontFamily: F.sans,
  },
});
