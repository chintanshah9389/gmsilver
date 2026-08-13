import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';

const { width: SW } = Dimensions.get('window');
const PAD = 16;
const GAP = 12;
export const PRODUCT_CARD_W = (SW - PAD * 2 - GAP) / 2;

type ProductCardProps = {
  item: {
    id: string;
    name?: string;
    price?: number | string;
    image1Url?: string | null;
    sku?: string;
  };
  onPress: () => void;
  onWish?: () => void;
  wished?: boolean;
  width?: number;
};

export default function ProductCard({
  item,
  onPress,
  onWish,
  wished,
  width = PRODUCT_CARD_W,
}: ProductCardProps) {
  const imgH = width * 1.22;

  return (
    <ScalePressable style={[s.card, { width }]} scaleTo={0.98} onPress={onPress}>
      <View style={[s.imgWrap, { height: imgH }]}>
        {item.image1Url ? (
          <Image source={{ uri: item.image1Url }} style={s.img} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[C.facetA, C.facetB]} style={s.imgPlaceholder}>
            <Text style={s.imgInitial}>{item.name?.[0]?.toUpperCase() ?? 'G'}</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.35)']}
          style={s.imgFade}
        />
        <LinearGradient
          colors={[C.facetA, C.facetB]}
          style={s.facetCorner}
        />
        {onWish ? (
          <ScalePressable
            style={[s.wishBtn, wished && s.wishBtnActive]}
            scaleTo={0.9}
            onPress={onWish}
          >
            <Icon
              source={wished ? 'heart' : 'heart-outline'}
              size={15}
              color={wished ? C.error : C.textSub}
            />
          </ScalePressable>
        ) : null}
      </View>
      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={s.priceRow}>
          <View style={s.priceDash} />
          <Text style={s.price}>₹{Number(item.price || 0).toLocaleString()}</Text>
        </View>
      </View>
    </ScalePressable>
  );
}

export const PRODUCT_GRID = { PAD, GAP };

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    ...E.cardShadow,
  },
  imgWrap: {
    width: '100%',
    backgroundColor: C.surface2,
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
  facetCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderBottomLeftRadius: 16,
    opacity: 0.85,
  },
  imgInitial: { color: C.goldDim, fontSize: 34, fontWeight: '700' },
  wishBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...E.softShadow,
  },
  wishBtnActive: { backgroundColor: '#FFF5F5' },
  body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 },
  name: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  priceDash: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.gold,
  },
  price: {
    color: C.goldDim,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
