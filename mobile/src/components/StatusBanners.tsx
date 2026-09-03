import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { R } from '@/theme/colors';
import { F } from '@/theme/typography';

type Props = {
  origin?: string | null;
  inStock: boolean;
  /** solid = list chips; soft = detail page */
  variant?: 'solid' | 'soft';
};

const TONE = {
  indian: { bg: '#BE185D', softBg: '#FDF2F8', softText: '#9D174D', label: 'Indian' },
  imported: { bg: '#0369A1', softBg: '#F0F9FF', softText: '#0369A1', label: 'Imported' },
  inStock: { bg: '#047857', softBg: '#ECFDF5', softText: '#047857', label: 'In stock' },
  out: { bg: '#B91C1C', softBg: '#FEF2F2', softText: '#B91C1C', label: 'Out of stock' },
};

export default function StatusBanners({ origin, inStock, variant = 'solid' }: Props) {
  const originTone =
    origin === 'IMPORTED' ? TONE.imported : origin === 'INDIAN' ? TONE.indian : null;
  const stockTone = inStock ? TONE.inStock : TONE.out;
  const soft = variant === 'soft';

  return (
    <View style={s.wrap}>
      {originTone ? (
        <View
          style={[
            soft ? s.softBanner : s.banner,
            soft
              ? { backgroundColor: originTone.softBg }
              : { backgroundColor: originTone.bg },
          ]}
        >
          <Text style={[soft ? s.softText : s.text, soft && { color: originTone.softText }]}>
            {originTone.label}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          soft ? s.softBanner : s.banner,
          soft ? { backgroundColor: stockTone.softBg } : { backgroundColor: stockTone.bg },
        ]}
      >
        <Text style={[soft ? s.softText : s.text, soft && { color: stockTone.softText }]}>
          {stockTone.label}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  banner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  softBanner: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: R.pill,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: F.sans,
  },
  softText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: F.sans,
  },
});
