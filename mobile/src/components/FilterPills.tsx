import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';

export type ProductFilterId = 'all' | 'indian' | 'imported' | 'in_stock';

export const PRODUCT_FILTERS: {
  id: ProductFilterId;
  label: string;
  idleBg: string;
  idleText: string;
  dot: string;
}[] = [
  { id: 'all', label: 'All', idleBg: C.chipPeach, idleText: C.chipPeachText, dot: C.ruby },
  { id: 'indian', label: 'Indian', idleBg: '#FCE7F3', idleText: '#BE185D', dot: '#BE185D' },
  { id: 'imported', label: 'Imported', idleBg: '#E0F2FE', idleText: '#0369A1', dot: '#0369A1' },
  { id: 'in_stock', label: 'In-stock', idleBg: '#D1FAE5', idleText: '#047857', dot: '#047857' },
];

export default function FilterPills({
  value,
  onChange,
}: {
  value: ProductFilterId;
  onChange: (id: ProductFilterId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {PRODUCT_FILTERS.map((item) => {
        const active = value === item.id;
        return (
          <ScalePressable
            key={item.id}
            style={[s.chip, { backgroundColor: active ? C.ruby : item.idleBg }]}
            scaleTo={0.97}
            onPress={() => onChange(item.id)}
          >
            {!active && item.id !== 'all' ? (
              <View style={[s.dot, { backgroundColor: item.dot }]} />
            ) : null}
            <Text style={[s.text, { color: active ? '#FFFFFF' : item.idleText }]} numberOfLines={1}>
              {item.label}
            </Text>
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: F.sans,
  },
});
