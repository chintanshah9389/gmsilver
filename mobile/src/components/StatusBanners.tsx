import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { F } from '@/theme/typography';

type Props = {
  origin?: string | null;
  inStock: boolean;
};

const TONE = {
  indian: { bg: '#BE185D', label: 'Indian' },
  imported: { bg: '#0369A1', label: 'Imported' },
  inStock: { bg: '#047857', label: 'In stock' },
  out: { bg: '#B91C1C', label: 'Out of stock' },
};

export default function StatusBanners({ origin, inStock }: Props) {
  const originTone =
    origin === 'IMPORTED' ? TONE.imported : origin === 'INDIAN' ? TONE.indian : null;
  const stockTone = inStock ? TONE.inStock : TONE.out;

  return (
    <View style={s.wrap}>
      {originTone ? (
        <View style={[s.banner, { backgroundColor: originTone.bg }]}>
          <Text style={s.text}>{originTone.label}</Text>
        </View>
      ) : null}
      <View style={[s.banner, { backgroundColor: stockTone.bg }]}>
        <Text style={s.text}>{stockTone.label}</Text>
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
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: F.sans,
  },
});
