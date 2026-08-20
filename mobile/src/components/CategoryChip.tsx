import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
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

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      style={[s.chip, active && s.chipActive]}
      scaleTo={0.97}
      onPress={onPress}
    >
      <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </ScalePressable>
  );
}

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
        <Chip label="All" active={!selectedId} onPress={onSeeAll} />
      ) : null}
      {items.map((item) => (
        <Chip
          key={item.id}
          label={item.name}
          active={selectedId === item.id}
          onPress={() => onSelect(item)}
        />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    paddingHorizontal: 24,
    gap: 18,
    paddingBottom: 4,
  },
  chip: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  chipActive: {
    borderBottomColor: C.ruby,
  },
  chipText: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  chipTextActive: {
    color: C.text,
  },
});
