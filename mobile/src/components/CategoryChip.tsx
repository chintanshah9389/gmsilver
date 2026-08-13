import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
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
  if (active) {
    return (
      <ScalePressable scaleTo={0.96} onPress={onPress} style={s.chipActiveWrap}>
        <LinearGradient
          colors={[C.goldGradStart, C.goldGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.chipActive}
        >
          <Text style={s.chipTextActive} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      </ScalePressable>
    );
  }

  return (
    <ScalePressable style={s.chip} scaleTo={0.96} onPress={onPress}>
      <Text style={s.chipText} numberOfLines={1}>
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
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.sm,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...E.softShadow,
  },
  chipActiveWrap: {
    borderRadius: R.sm,
    overflow: 'hidden',
    ...E.softShadow,
  },
  chipActive: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.sm,
  },
  chipText: {
    color: C.textSub,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
