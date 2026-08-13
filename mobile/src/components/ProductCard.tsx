import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
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
  const imgH = width * 1.15;

  return (
    <ScalePressable style={[s.card, { width }, E.softShadow]} scaleTo={0.98} onPress={onPress}>
      <View style={[s.imgWrap, { height: imgH }]}>
        {item.image1Url ? (
          <Image source={{ uri: item.image1Url }} style={s.img} resizeMode="cover" />
        ) : (
          <View style={s.imgPlaceholder}>
            <Text style={s.imgInitial}>{item.name?.[0]?.toUpperCase() ?? '✦'}</Text>
          </View>
        )}
        {onWish ? (
          <ScalePressable
            style={[s.wishBtn, wished && s.wishBtnActive]}
            scaleTo={0.9}
            onPress={onWish}
          >
            <Icon
              source={wished ? 'heart' : 'heart-outline'}
              size={16}
              color={wished ? C.error : C.textSub}
            />
          </ScalePressable>
        ) : null}
      </View>
      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={s.price}>₹{Number(item.price || 0).toLocaleString()}</Text>
      </View>
    </ScalePressable>
  );
}

export const PRODUCT_GRID = { PAD, GAP };

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
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
    backgroundColor: C.surface3,
  },
  imgInitial: { color: C.textMuted, fontSize: 36, fontWeight: '700' },
  wishBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...E.softShadow,
  },
  wishBtnActive: {
    backgroundColor: '#FFF5F5',
  },
  body: { paddingHorizontal: 12, paddingVertical: 12 },
  name: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  price: {
    color: C.goldDim,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
