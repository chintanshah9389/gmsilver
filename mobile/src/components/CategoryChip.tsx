import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, R } from '@/theme/colors';
import ScalePressable from '@/components/ScalePressable';

export type CategoryChipItem = {
  id: string;
  name: string;
};

type CategoryChipRowProps = {
  items: CategoryChipItem[];
  selectedId?: string | null;
  onSelect: (item: CategoryChipItem) => void;
  onSeeAll?: () => void;
};

export default function CategoryChipRow({
  items,
  selectedId,
  onSelect,
  onSeeAll,
}: CategoryChipRowProps) {
  if (!items.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {onSeeAll ? (
        <ScalePressable
          style={[s.chip, !selectedId && s.chipActive]}
          scaleTo={0.96}
          onPress={onSeeAll}
        >
          <Text style={[s.chipText, !selectedId && s.chipTextActive]}>All</Text>
        </ScalePressable>
      ) : null}
      {items.map((item) => {
        const active = selectedId === item.id;
        return (
          <ScalePressable
            key={item.id}
            style={[s.chip, active && s.chipActive]}
            scaleTo={0.96}
            onPress={() => onSelect(item)}
          >
            <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={1}>
              {item.name}
            </Text>
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  chipText: {
    color: C.textSub,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
